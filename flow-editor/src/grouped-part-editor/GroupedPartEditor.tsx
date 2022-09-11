import * as React from "react";

import {
  isExternalConnectionNode,
  THIS_INS_ID,
  ConnectionData,
  isInternalConnectionNode,
  GroupedPart,
  partInput,
  PartInstance,
  partOutput,
  PinType,
  isStaticInputPinConfig,
  InputMode,
  getPartDef,
  isGroupedPart,
  connectionDataEquals,
  ConnectionNode,
  staticInputPinConfig,
  toEnvValue,
  randomInt,
  PartInstanceConfig,
  delay,
  noop,
  keys,
  TRIGGER_PIN_ID,
  ImportablePart,
  inlinePartInstance,
  isInlinePartInstance,
  isRefPartInstance,
  CodePartTemplateTypeInline,
  isCodePart,
  InlinePartInstance,
  ResolvedFlydeFlowDefinition,
} from "@flyde/core";
import { InstanceView } from "./instance-view/InstanceView";
import { ConnectionView } from "./connection-view";
import { entries, isDefined, Pos, preventDefaultAnd, Size, values } from "../utils";

import {
  toggleStickyPin,
  findClosestPin,
  getSelectionBoxRect,
  emptyObj,
  createNewPartInstance,
  ViewPort,
  domToViewPort,
  roundNumber,
  animatePos,
  fitViewPortToPart,
  dismantleGroup,
  getInstancesInRect,
  calcMoveViewPort,
  handleInstanceDrag,
  handleIoPinRename,
  handleChangePartInputType,
  calcSelectionBoxArea,
} from "./utils";

import { produce } from "immer";
import { useState, useRef, useEffect } from "react";
import { useHotkeys } from "../lib/react-utils/use-hotkeys";
import useComponentSize from "@rehooks/component-size";

import { Slider, Menu, MenuItem, ContextMenu, Button } from "@blueprintjs/core";
import { PartIoView, PartIoType } from "./part-io-view";

import { vec, vSub } from "../physics";
import { QuickAddMenu, QuickAddMenuData, QuickMenuMatch } from "./quick-add-menu";
import { queueInputPinConfig } from "@flyde/core";
import { HistoryPayload } from "@flyde/remote-debugger";
import { orderGroupedPart } from "./order-layout/cmd";
import { LayoutDebugger, LayoutDebuggerProps } from "./layout-debugger";
import { preloadMonaco } from "../lib/preload-monaco";
import { InstancePanel } from "./instance-panel";
import { toastMsg, AppToaster } from "../toaster";
import {
  FlydeFlowChangeType,
  functionalChange,
  metaChange,
} from "../flow-editor/flyde-flow-change-type";
import { createEditorCommand } from "../flow-editor/commands/commands";
import { EditorCommand } from "../flow-editor/commands/definition";
import { usePrompt } from "../lib/react-utils/prompt";
import { InlineCodeModal } from "../flow-editor/inline-code-modal";
import { createInlineCodePart } from "../flow-editor/inline-code-modal/inline-code-to-part";
import _ from "lodash";
import { groupSelected } from "../group-selected";

const MemodSlider = React.memo(Slider);

const sliderRenderer = (p: any) => <div></div>;

export const PART_HEIGHT = 28;
const DBL_CLICK_TIME = 300;

const defaultPos = { x: 0, y: 0 };

export const defaultViewPort: ViewPort = {
  pos: { x: 0, y: 0 },
  zoom: 1,
};

export interface ClosestPinData {
  ins: PartInstance;
  pin: string;
  type: "input" | "output";
}

export type ClipboardData = {
  instances: PartInstance[];
  connections: ConnectionData[];
};

export type GroupEditorBoardData = {
  viewPort: ViewPort;
  selected: string[];
  lastMousePos: Pos;
  from?: ConnectionNode;
  to?: ConnectionNode;
};

export type GroupedPartEditorProps = {
  part: GroupedPart;
  insId: string;

  clipboardData: ClipboardData;
  resolvedFlow: ResolvedFlydeFlowDefinition;

  partIoEditable: boolean;
  thumbnailMode?: true;

  boardData: GroupEditorBoardData;

  onChangeBoardData: (data: Partial<GroupEditorBoardData>) => void;

  onChangePart: (val: GroupedPart, type: FlydeFlowChangeType) => void;

  onCopy: (data: ClipboardData) => void;
  onInspectPin: (insId: string, pinId: string, type: PinType) => void;

  onEditPart: (partId: string) => void;
  // editOrCreateConstValue: (
  //   ins: PartInstance,
  //   pinId: string,
  //   type: string,
  //   pos: Pos,
  //   useInlineCode?: boolean
  // ) => void;
  // requestNewConstValue: (pos: Pos) => void;
  onNewEnvVar?: (name: string, value: any) => void;

  // onGroupSelected: () => void;
  onRequestHistory: (insId: string, pinId: string, pinType: PinType) => Promise<HistoryPayload>;
  onRequestImportables?: (query: string) => Promise<ImportablePart[]>;

  onShowOmnibar: (e: any) => void;

  onCommand: (command: EditorCommand) => void;
};

type InlineValueTarget = 
    {insId: string, value: string, templateType: CodePartTemplateTypeInline}

export const GroupedPartEditor: React.FC<GroupedPartEditorProps & { ref?: any }> = React.memo(
  React.forwardRef((props, ref) => {
    const {
      onChangePart: onChange,
      onCommand,
      partIoEditable,
      onCopy,
      // onToggleLog,
      // onToggleBreakpoint,
      onEditPart,
      // editOrCreateConstValue,
      // requestNewConstValue,
      onRequestHistory,
      onInspectPin,
      onNewEnvVar,
      boardData,
      onChangeBoardData,
      insId: thisInsId,
      part,
      onShowOmnibar,
      resolvedFlow
    } = props;

    const [repo, setRepo] = useState({...resolvedFlow.dependencies, [resolvedFlow.main.id]: resolvedFlow.main});

    useEffect(() => {
      setRepo({...resolvedFlow.dependencies, [resolvedFlow.main.id]: resolvedFlow.main});
    }, [resolvedFlow])
    


    const { selected, from, to } = boardData;
    const { instances, connections, inputsPosition, outputsPosition, inputs, outputs } = part;

    // hooks area
    const [draggingId, setDraggingId] = useState<string>();
    const [selectionBox, setSelectionBox] = useState<{ from: Pos; to: Pos }>();

    const [lastBoardClickTime, setLastBoardClickTime] = useState<number>(0);

    const [lastSelectedId, setLastSelectedId] = useState<string>(); // to avoid it disappearing when doubling clicking to edit

    const [didCenterInitially, setDidCenterInitially] = useState(false);

    const [quickAddMenuVisible, setQuickAddMenuVisible] = useState<QuickAddMenuData>();

    const [copiedConstValue, setCopiedConstValue] = useState<any>();

    const [inlineCodeTarget, setInlineCodeTarget] = useState<InlineValueTarget>();

    const [inspectedInstance, setInspectedInstance] = useState<{
      part: GroupedPart;
      insId: string;
    }>();

    const _prompt = usePrompt();

    const viewPort = boardData.viewPort;

    const setViewPort = React.useCallback(
      (viewPort) => {
        onChangeBoardData({ viewPort });
      },
      [onChangeBoardData]
    );

    const _onRequestHistory: GroupedPartEditorProps["onRequestHistory"] = React.useCallback(
      (insId, pinId, pinType) => {
        return onRequestHistory(`${thisInsId}.${insId}`, pinId, pinType);
      },
      [onRequestHistory, thisInsId]
    );

    const _onInspectPin: GroupedPartEditorProps["onInspectPin"] = React.useCallback(
      (insId, pinId, pinType) => {
        return onInspectPin(`${thisInsId}.${insId}`, pinId, pinType);
      },
      [onInspectPin, thisInsId]
    );

    const onConnectionClose = React.useCallback(
      (from: ConnectionNode, to: ConnectionNode) => {
        onCommand(createEditorCommand("close-connection", { from, to }));
      },
      [onCommand]
    );

    const onGroupSelectedInternal = React.useCallback(async () => {
      const name = await _prompt('Part name?');
      const { currentPart } = groupSelected(boardData.selected, part, name, 'inline');
      onChange(currentPart, functionalChange('group part'));

      toastMsg('Part grouped!');
    }, [_prompt, boardData.selected, onChange, part]);

    useEffect(() => {
      if (lastSelectedId) {
        const t = setTimeout(() => {
          setLastSelectedId(undefined);
        }, 350);

        return () => clearTimeout(t);
      }
    }, [lastSelectedId]);

    const [closestPin, setClosestPin] = useState<{
      ins: PartInstance;
      pin: string;
      type: "input" | "output";
    }>();

    useEffect(() => {
      preloadMonaco();
    }, []);

    const boardRef = useRef<HTMLDivElement>();
    const vpSize: Size = useComponentSize(boardRef);
    const lastMousePos = React.useRef({ x: 400, y: 400 });

    const boardPos = boardRef.current ? boardRef.current.getBoundingClientRect() : defaultPos;

    const fitToScreen = () => {
      const vp = fitViewPortToPart(part, repo, vpSize);

      console.log({ vp });
      animatePos(viewPort.pos, vp.pos, 10, (dp) => {
        setViewPort({ pos: dp, zoom: vp.zoom });
      });
      // setViewPort(vp);
    };

    const onPartIoPinClick = React.useCallback(
      (pinId: string, type: PinType) => {
        const { to: currTo, from: currFrom } = boardData;

        const relevantCurrPin = type === "input" ? currFrom : currTo;
        const relevantTargetPin = type === "input" ? currTo : currFrom;

        const newPin = { pinId, insId: THIS_INS_ID };
        const targetObj = type === "input" ? { from: newPin } : { to: newPin };

        if (relevantCurrPin && relevantCurrPin.pinId === pinId) {
          // selecting the same pin so deselect both
          onChangeBoardData({ from: undefined, to: undefined });
        } else if (!relevantTargetPin) {
          // nothing was selected, selecting a new pin
          onChangeBoardData(targetObj);
        } else {
          //close the connection if we have a target match
          if (type === "input" && currTo) {
            onConnectionClose(newPin, currTo);
          } else if (currFrom) {
            onConnectionClose(currFrom, newPin);
          }
        }
      },
      [boardData, onChangeBoardData, onConnectionClose]
    );

    const onPinClick = React.useCallback(
      (ins: PartInstance, pinId: string, type: PinType) => {
        const { from: currFrom, to: currTo } = boardData;

        if (type === "input") {
          const to = { insId: ins.id, pinId };

          // is selecting same one
          if (
            currTo &&
            currTo.pinId === pinId &&
            (isInternalConnectionNode(currTo) ? currTo.insId === ins.id : true)
          ) {
            onChangeBoardData({ to: undefined });
          } else if (from) {
            onConnectionClose(from, to);
          } else {
            onChangeBoardData({ to });
          }
        } else {
          const from = { insId: ins.id, pinId };

          if (
            currFrom &&
            currFrom.pinId === pinId &&
            (isInternalConnectionNode(currFrom) ? currFrom.insId === ins.id : true)
          ) {
            onChangeBoardData({ from: undefined });
          } else if (to) {
            onConnectionClose(from, to);
          } else {
            onChangeBoardData({ from });
          }
        }
      },
      [boardData, from, onChangeBoardData, onConnectionClose, to]
    );

    useEffect(() => {
      if (!didCenterInitially && vpSize.width) {
        const vp = fitViewPortToPart(part, repo, vpSize);
        if (!props.thumbnailMode) {
          // hack to make project view work nicely
          setViewPort(vp);
        }
        // hackidy hack
        const timer = setTimeout(() => {
          const vp = fitViewPortToPart(part, repo, vpSize);
          if (!props.thumbnailMode) {
            // hack to make project view work nicely
            setViewPort(vp);
          }
          setDidCenterInitially(true);
        }, 100);
        return () => clearTimeout(timer);
      }
    }, [part, vpSize, props.thumbnailMode, didCenterInitially, repo, setViewPort]);

    const onCopyInner = React.useCallback(() => {
      const { selected } = boardData;
      const instances = part.instances
        .filter((ins) => selected.includes(ins.id))
        .map((ins) => ({ ...ins, id: ins.id + "-copy" }));
      const connections = part.connections
        .filter(({ from, to }) => {
          return selected.includes(from.insId) && selected.includes(to.insId);
        })
        .map(({ from, to }) => {
          return {
            from: { ...from, insId: `${from.insId}-copy` },
            to: { ...to, insId: `${to.insId}-copy` },
          };
        });
      onCopy({ instances, connections });
    }, [boardData, onCopy, part]);

    const onPaste = React.useCallback(() => {
      onCommand(
        createEditorCommand("paste-instances", { instances: props.clipboardData.instances })
      );
    }, [onCommand, props.clipboardData.instances]);

    const selectClosest = React.useCallback(() => {
      const rootId = part.id;

      if (!closestPin) {
        console.warn("tried selecting closest with no pin nearby");
        return;
      }

      if (closestPin.type === "input") {
        if (closestPin.ins.id === rootId) {
          onPartIoPinClick(closestPin.pin, "input");
        } else {
          onPinClick(closestPin.ins, closestPin.pin, "input");
        }
      } else {
        if (closestPin.ins.id === rootId) {
          onPartIoPinClick(closestPin.pin, "output");
        } else {
          onPinClick(closestPin.ins, closestPin.pin, "output");
        }
      }
    }, [part.id, closestPin, onPartIoPinClick, onPinClick]);

    useHotkeys(
      "cmd+=",
      (e: any) => {
        setViewPort({ ...viewPort, zoom: viewPort.zoom + 0.1 });
        e.preventDefault();
      },
      [viewPort]
    );

    useHotkeys(
      "cmd+-",
      (e) => {
        setViewPort({ ...viewPort, zoom: viewPort.zoom - 0.1 });
        e.preventDefault();
      },
      []
    );

    useHotkeys(
      "cmd+o",
      (e) => {
        e.preventDefault();
        toastMsg("Ordering");
        const steps: any[] = [];
        orderGroupedPart(part, repo, 200, (step, idx) => {
          if (idx % 3 === 0) {
            steps.push(step);
          }
        });

        (async () => {
          while (steps.length) {
            const s = steps.shift();
            toastMsg(`Step ${steps.length}!`);
            await delay(200);
            onChange(s, metaChange("order-step"));
            toastMsg(`Step ${steps.length}! done`);
          }
        })();
      },
      [onChange, part, resolvedFlow]
    );

    useHotkeys(
      "cmd+0",
      (e) => {
        setViewPort({ ...viewPort, zoom: 1 });
        e.preventDefault();
      },
      [viewPort]
    );

    const clearSelections = () => {
      onChangeBoardData({
        from: undefined,
        to: undefined,
        selected: [],
      });
    };

    const onStartDragging = React.useCallback(
      (ins: PartInstance, event: React.MouseEvent) => {
        event.preventDefault();
        event.stopPropagation();
        setDraggingId(ins.id);
        onChange({ ...part }, metaChange("drag-start"));
      },
      [onChange, part]
    );

    const onDragMove = React.useCallback(
      (ins: PartInstance, event: any, pos: Pos) => {
        const { newValue, newSelected } = handleInstanceDrag(
          part,
          ins,
          pos,
          event,
          selected,
          draggingId
        );
        onChange(newValue, metaChange("drag-move"));
        if (newSelected) {
          onChangeBoardData({ selected: newSelected });
        }
      },
      [draggingId, onChange, onChangeBoardData, selected, part]
    );

    const onDragEnd = React.useCallback((_, event) => {
      event.preventDefault();
      event.stopPropagation();
      setDraggingId(undefined);
    }, []);

    const onStartDraggingPartIo = React.useCallback((_: string, event: any) => {
      event.preventDefault();
      event.stopPropagation();
      setDraggingId(THIS_INS_ID);
    }, []);

    const onDragMovePartIo = React.useCallback(
      async (type: "input" | "output", pin: string, event: any, data: any) => {
        event.preventDefault();
        event.stopPropagation();
        const { x, y } = data;
        // setDraggingId(undefined);

        const newValue = produce(part, (draft) => {
          if (type === "input") {
            draft.inputsPosition[pin] = { x, y };
          } else {
            draft.outputsPosition[pin] = { x, y };
          }
        });

        props.onChangePart(newValue, metaChange("part-io-drag-move"));
      },
      [props, part]
    );

    const onDragEndPartIo = React.useCallback(
      async (type: "input" | "output", pin: string, event: any, data: any) => {
        event.preventDefault();
        event.stopPropagation();
        // const { x, y } = data;
        setDraggingId(undefined);
      },
      []
    );

    const onSelectInstance = React.useCallback(
      ({ id }: PartInstance, ev: React.MouseEvent) => {
        const newSelectedIfSelectionExists = ev.shiftKey
          ? selected.filter((sid) => sid !== id)
          : [];
        const newSelectedIfSelectionIsNew = ev.shiftKey ? [...selected, id] : [id];
        const newSelected = selected.includes(id)
          ? newSelectedIfSelectionExists
          : newSelectedIfSelectionIsNew;

        onChangeBoardData({
          selected: newSelected,
          from: undefined,
          to: undefined,
        });
      },
      [onChangeBoardData, selected]
    );

    const selectAll = React.useCallback(() => {
      const allIds = part.instances.map((i) => i.id);
      onChangeBoardData({ selected: allIds, from: undefined, to: undefined });
    }, [onChangeBoardData, part.instances]);

    const deleteInstance = React.useCallback(() => {
      const { selected } = boardData;
      const { instances, connections } = part;
      if (selected.length) {
        const newConnections = connections.filter(({ from, to }) => {
          return selected.indexOf(from.insId) === -1 && selected.indexOf(to.insId) === -1;
        });

        const newValue = produce(part, (draft) => {
          draft.connections = newConnections;
          draft.instances = instances.filter((ins) => !selected.includes(ins.id));
        });

        onChange(newValue, functionalChange("delete-ins"));
        onChangeBoardData({ selected: [] });
      }
    }, [boardData, onChange, onChangeBoardData, part]);

    const onToggleSticky = React.useCallback(
      (ins: PartInstance, pinId: string, forceValue?: boolean) => {
        onChange(
          toggleStickyPin(part, ins.id, pinId, forceValue),
          functionalChange("toggle-sticky")
        );
      },
      [onChange, part]
    );

    const duplicate = React.useCallback(() => {
      onCommand({ type: "duplicate-selected", payload: { selected } });
      // onChange(duplicateSelected(value), functionalChange("duplicate"));
    }, [onCommand, selected]);

    const vpMoveStart = useRef<Pos>();
    const posRef = useRef<Pos>();

    const onMouseDown: React.MouseEventHandler = React.useCallback(
      (e) => {
        const target = e.target as HTMLElement;

        if (e.button !== 0) {
          // left click
          return;
        }

        if (e.shiftKey) {
          posRef.current = { x: e.pageX, y: e.pageY };
          vpMoveStart.current = viewPort.pos;
        } else {
          if (target && target.className === "board-editor-inner") {
            // dbl click and onMouseDown did not work, so we use onMouseDown to detect double click
            if (Date.now() - lastBoardClickTime < DBL_CLICK_TIME) {
              onShowOmnibar(e);
              return;
            }
            setLastBoardClickTime(Date.now());
            // const boardRect = boardRef.current!.getBoundingClientRect();
            const pos = { x: e.clientX, y: e.clientY };
            setSelectionBox({ from: pos, to: pos });
          }
        }
      },
      [viewPort.pos, lastBoardClickTime, onShowOmnibar]
    );

    const onMouseUp: React.MouseEventHandler = React.useCallback(
      (e) => {
        if (selectionBox) {
          if (calcSelectionBoxArea(selectionBox) > 50) {
            const toSelect = getInstancesInRect(
              selectionBox,
              repo,
              viewPort,
              instancesConnectToPinsRef.current,
              part.instances,
              boardPos
            );
            const newSelected = e.shiftKey ? [...selected, ...toSelect] : toSelect;
            onChangeBoardData({ selected: newSelected });
          }
          setSelectionBox(undefined);
        }

        posRef.current = undefined;
        vpMoveStart.current = undefined;
      },
      [selectionBox, repo, viewPort, part.instances, boardPos, selected, onChangeBoardData]
    );

    const onMouseMove: React.MouseEventHandler = React.useCallback(
      (e) => {
        const posForSelection = { x: e.clientX - boardPos.x, y: e.clientY - boardPos.y };

        const eventPos = { x: e.clientX, y: e.clientY };
        const normal = vSub(eventPos, boardPos);
        const posInBoard = domToViewPort(normal, viewPort);
        // const posInBoard = normal; //domToViewPort(eventPos, viewPort);

        // console.log({bpy: boardPos.y, ny: normal.y, epy: eventPos.y, py: posInBoard.y});

        if (selectionBox) {
          setSelectionBox({ ...selectionBox, to: eventPos });
        }

        if (posRef.current && vpMoveStart.current) {
          console.log("changing VP");
          const newViewPort = calcMoveViewPort(e, posRef.current, vpMoveStart.current, viewPort);
          setViewPort(newViewPort);
        }

        const closest = findClosestPin(part, repo, posForSelection, vpSize, boardPos, thisInsId);
        const currClosest = closestPin;
        if (closest) {
          const isNewClosest =
            !currClosest ||
            currClosest.ins !== closest.ins ||
            (currClosest.ins === closest.ins && currClosest.pin !== closest.pin);
          if (isNewClosest) {
            setClosestPin({
              ins: closest.ins,
              type: closest.type,
              pin: closest.id,
            });
          }
        }

        // lastMousePos.current = posInBoard;
        lastMousePos.current = posInBoard;
        onChangeBoardData({ lastMousePos: lastMousePos.current });
      },
      [boardPos, viewPort, selectionBox, part, repo, vpSize, thisInsId, closestPin, onChangeBoardData, setViewPort]
    );

    const onMouseLeave: React.MouseEventHandler = React.useCallback(() => {
      setClosestPin(undefined);
      posRef.current = undefined;
      vpMoveStart.current = undefined;
    }, []);

    const onDblClickInstance = React.useCallback(
      (ins: PartInstance, shift: boolean) => {
        if (shift) {
          const part = isInlinePartInstance(ins) ? ins.part : getPartDef(ins.partId, repo)
          if (!part) {
            throw new Error(`Impossible state inspecting inexisting part`);
          }
          if (!isGroupedPart(part)) {
            toastMsg("Cannot inspect a non visual part", "warning");
            //`Impossible state inspecting grouped part`);
            return;
          }

          setInspectedInstance({ insId: `${thisInsId}.${ins.id}`, part });
        } else {
          if (isRefPartInstance(ins)) {
            onEditPart(ins.partId);
          } else {
            const part  = ins.part;
            if (!isCodePart(part)) {
              toastMsg('Editing non code inline part is not supported');
              return;
            }
            const value = atob(part.dataBuilderSource);
            setInlineCodeTarget({insId: ins.id, templateType: part.templateType, value})
            toastMsg('Editing inline grouped part not supported yet');
          }
        }
      },
      [onEditPart, repo, thisInsId]
    );

    const onDismantleGroup = React.useCallback(
      (groupPartIns: PartInstance) => {
        const valueAfterDismantling = dismantleGroup(part, groupPartIns, repo);
        onChange(valueAfterDismantling, { type: "functional", message: "dismantle group" });
        // todo - combine the above with below to an atomic action
        onChangeBoardData({ selected: [] });
      },
      [part, repo, onChange, onChangeBoardData]
    );

    const onDetachConstValue = React.useCallback(
      (ins: PartInstance, pinId: string) => {
        onCommand(createEditorCommand("detach-const", { insId: ins.id, inputId: pinId }));
      },
      [onCommand]
    );

    const onCopyConstValue = React.useCallback((ins: PartInstance, pinId: string) => {
      const config = ins.inputConfig[pinId] || queueInputPinConfig();
      if (isStaticInputPinConfig(config)) {
        setCopiedConstValue(config.value);
        AppToaster.show({ message: "Value copied" });
      }
    }, []);

    const onPasteConstValue = React.useCallback(
      (ins: PartInstance, pinId: string) => {
        const newValue = produce(part, (draft) => {
          const insToChange = draft.instances.find((_ins) => _ins.id === ins.id);
          if (!insToChange) {
            throw new Error("Impossible state");
          }
          insToChange.inputConfig[pinId] = staticInputPinConfig(copiedConstValue);
          draft.connections = draft.connections.filter((conn) => {
            if (isInternalConnectionNode(conn.to)) {
              return !(conn.to.insId === ins.id && conn.to.pinId === pinId);
            } else {
              return true;
            }
          });
        });

        onChange(newValue, functionalChange("paste const value"));
      },
      [part, onChange, copiedConstValue]
    );

    const onConvertConstToEnv = React.useCallback(
      async (ins: PartInstance, pinId: string) => {
        if (!onNewEnvVar) {
          throw new Error("Impossible state");
        }

        const currConfig = ins.inputConfig[pinId];
        if (!isStaticInputPinConfig(currConfig)) {
          throw new Error(`Impossible state converting non const input to env var`);
        }
        const name = await _prompt("Env variable name?", `myVar${randomInt(9999)}`);
        if (name) {
          const newValue = produce(part, (draft) => {
            draft.instances.forEach((_ins) => {
              if (ins.id === _ins.id) {
                _ins.inputConfig[pinId] = staticInputPinConfig(toEnvValue(name));
              }
            });
          });
          // todo - fix below actions to be atomic, this is a source for bugs
          onChange(newValue, functionalChange("convert const to env"));
          onNewEnvVar(name, currConfig.value);
        }
      },
      [_prompt, onChange, onNewEnvVar, part]
    );

    const onAddIoPin = React.useCallback(
      async (type: PartIoType) => {
        const newPinId = await _prompt("New name?") || "na";
        const newPinType = await _prompt("type?") || "any";

        const newValue = produce(part, (draft) => {
          if (type === "input") {
            if (!part.inputs) {
              draft.inputs = {};
            }
            draft.inputs[newPinId] = partInput(newPinType);
            draft.inputsPosition[newPinId] = lastMousePos.current;
          } else {
            if (!part.outputs) {
              draft.outputs = {};
            }
            draft.outputs[newPinId] = partOutput(newPinType, false, false);
            draft.outputsPosition[newPinId] = lastMousePos.current;
          }
        });

        onChange(newValue, functionalChange("add new io pin"));
      },
      [_prompt, part, onChange]
    );

    const editCompletionOutputs = React.useCallback(async () => {
      const curr = part.completionOutputs?.join(",");
      const newVal = await _prompt(`Edit completion outputs`, curr);
      if (isDefined(newVal) && newVal !== null) {
        const newValue = produce(part, (draft) => {
          draft.completionOutputs = newVal === "" ? undefined : newVal.split(",");
        });

        onChange(newValue, functionalChange("change part completions"));
      }
    }, [_prompt, onChange, part]);

    const editReactiveInputs = React.useCallback(async () => {
      const curr = part.reactiveInputs?.join(",");
      const newVal = await _prompt(`Edit reactive inputs`, curr);
      if (isDefined(newVal) && newVal !== null) {
        const newValue = produce(part, (draft) => {
          draft.reactiveInputs = newVal === "" ? undefined : newVal.split(",");
        });

        onChange(newValue, functionalChange("change reactive inputs"));
      }
    }, [_prompt, onChange, part]);

    const onRemoveIoPin = React.useCallback(
      (type: PartIoType, pinId: string) => {
        const newValue = produce(part, (draft) => {
          if (type === "input") {
            delete draft.inputs[pinId];
            draft.connections = draft.connections.filter(
              (conn) => !(isExternalConnectionNode(conn.from) && conn.from.pinId === pinId)
            );
          } else {
            draft.connections = draft.connections.filter(
              (conn) => !(isExternalConnectionNode(conn.to) && conn.to.pinId === pinId)
            );
            delete draft.outputs[pinId];
          }
        });

        onChange(newValue, functionalChange("remove io pin"));
      },
      [part, onChange]
    );

    const onRenameIoPin = React.useCallback(
      (type: PartIoType, pinId: string) => {
        const newValue = handleIoPinRename(part, type, pinId);
        onChange(newValue, functionalChange("rename io pin"));
      },
      [part, onChange]
    );

    const onChangeInputMode = React.useCallback(
      (pinId: string, mode: InputMode) => {
        const newValue = handleChangePartInputType(part, pinId, mode);
        onChange(newValue, functionalChange("toggle io pin optional"));
      },
      [part, onChange]
    );

    const renderPartInputs = () => {
      const from = boardData.from;

      return entries(inputs).map(([k, v]) => (
        <PartIoView
          insId={thisInsId}
          type="input"
          pos={inputsPosition[k] || { x: 0, y: 0 }}
          id={k}
          onDelete={partIoEditable ? onRemoveIoPin : undefined}
          onRename={partIoEditable ? onRenameIoPin : undefined}
          onDblClick={onMainInputDblClick}
          closest={
            !!(
              closestPin &&
              closestPin.type === "input" &&
              closestPin.ins.id === part.id &&
              closestPin.pin === k
            )
          }
          connected={false}
          inputMode={v.mode}
          onChangeInputMode={onChangeInputMode}
          key={k}
          viewPort={viewPort}
          onDragStart={onStartDraggingPartIo}
          onDragEnd={onDragEndPartIo}
          onDragMove={onDragMovePartIo}
          pinType={v.type}
          onSelect={onPartIoPinClick}
          selected={from?.pinId === k}
        />
      ));
    };

    const renderPartOutputs = () => {
      const { to } = boardData;
      return entries(outputs).map(([k, v]) => (
        <PartIoView
          insId={thisInsId}
          type="output"
          pos={outputsPosition[k] || { x: 0, y: 0 }}
          id={k}
          onDelete={partIoEditable ? onRemoveIoPin : undefined}
          onRename={partIoEditable ? onRenameIoPin : undefined}
          closest={
            !!(
              closestPin &&
              closestPin.type === "output" &&
              closestPin.ins.id === part.id &&
              closestPin.pin === k
            )
          }
          connected={false}
          key={k}
          viewPort={viewPort}
          onDragStart={onStartDraggingPartIo}
          onDragEnd={onDragEndPartIo}
          onDragMove={onDragMovePartIo}
          pinType={v.type}
          onSelect={onPartIoPinClick}
          selected={to?.pinId === k}
        />
      ));
    };

    const maybeDrawSelectionBox = () => {
      if (selectionBox) {
        const { from, to } = selectionBox;
        const { x, y, w, h } = getSelectionBoxRect(from, to);
        return <div className="selection-box" style={{ top: y, left: x, width: w, height: h }} />;
      } else {
        return null;
      }
    };

    const onPinDblClick = React.useCallback(
      async (ins: PartInstance, pinId: string, type: PinType, e: React.MouseEvent) => {
        if (type === "input") {
          const part = getPartDef(ins, repo);

          const partInput = part.inputs[pinId];
          const type = partInput ? partInput.type : "any";

          toastMsg('TODO');
          // editOrCreateConstValue(ins, pinId, type, lastMousePos.current, true);
        } else {
          const part = getPartDef(ins, repo);
          const pin = part.outputs[pinId];

          if (!pin) {
            throw new Error("Dbl clicked on un-existing pin");
          }

          const matches = values({...resolvedFlow.dependencies, [resolvedFlow.main.id]: resolvedFlow.main}).reduce<QuickMenuMatch[]>(
            (acc, curr) => {
              const matches: QuickMenuMatch[] = entries(curr.inputs).map(([id, val]) => ({
                pinId: id,
                pinType: val.type,
                part: curr,
                type: "part",
              }));

              return [...acc, ...matches];
            },
            [{ type: "value" }]
          );

          setQuickAddMenuVisible({
            pos: { x: e.clientX, y: e.clientY },
            matches,
            ins,
            pinId,
            pinType: pin.type,
          });
        }
      },
      [repo]
    );

    const onMainInputDblClick = React.useCallback(
      async (pinId: string, e: React.MouseEvent) => {
        const pin = part.inputs[pinId];

        if (!pin) {
          throw new Error("Dbl clicked on un-existing pin");
        }

        const matches = values(repo).reduce<QuickMenuMatch[]>(
          (acc, curr) => {
            const matches: QuickMenuMatch[] = entries(curr.inputs).map(([id, val]) => ({
              pinId: id,
              pinType: val.type,
              part: curr,
              type: "part",
            }));

            return [...acc, ...matches];
          },
          [{ type: "value" }]
        );

        setQuickAddMenuVisible({
          pos: { x: e.clientX, y: e.clientY },
          matches,
          pinId,
          pinType: pin.type,
        });
      },
      [part, resolvedFlow]
    );

    const onMaybeZoom = React.useCallback(
      (e: WheelEvent) => {
        if (e.metaKey) {
          // blockScroll();
          const zoomDiff = e.deltaY * -0.001;
          setViewPort({ ...viewPort, zoom: viewPort.zoom + zoomDiff });
          e.preventDefault();
        }
      },
      [setViewPort, viewPort]
    );

    useEffect(() => {
      const { current } = boardRef;
      if (current) {
        current.addEventListener("wheel", onMaybeZoom);

        return () => {
          current.removeEventListener("wheel", onMaybeZoom);
        };
      }
    }, [onMaybeZoom]);

    const backgroundStyle: any = {
      backgroundPositionX: roundNumber(-viewPort.pos.x * viewPort.zoom),
      backgroundPositionY: roundNumber(-viewPort.pos.y * viewPort.zoom),
      backgroundSize: roundNumber(25 * viewPort.zoom) + "px",
    };

    // unoptimized code to get connected inputs
    const instancesConnectToPinsRef = React.useRef(new Map());

    // prune orphan connections
    React.useEffect(() => {
      const validInputs = instances.reduce((acc, ins) => {
        const part = getPartDef(ins, repo);
        if (part) {
          acc.set(ins.id, keys(part.inputs));
        }
        return acc;
      }, new Map());

      const validOutputs = instances.reduce((acc, ins) => {
        const part = getPartDef(ins, repo);
        if (part) {
          acc.set(ins.id, keys(part.outputs));
        }
        return acc;
      }, new Map());
      const orphanConnections = connections.filter((conn) => {
        if (isExternalConnectionNode(conn.from) || isExternalConnectionNode(conn.to)) {
          return false;
          // TODO - check if external connection is still valid
        }
        if (conn.to.pinId === TRIGGER_PIN_ID) {
          return false;
        }

        const inputsExist =
          validInputs.get(conn.to.insId) && validInputs.get(conn.to.insId).includes(conn.to.pinId);
        const outputsExist =
          validOutputs.get(conn.from.insId) &&
          validOutputs.get(conn.from.insId).includes(conn.from.pinId);
        return !(inputsExist && outputsExist);
      });

      if (orphanConnections.length > 0) {
        toastMsg(`${orphanConnections.length} orphan connections removed`, "warning");
        console.log(`${orphanConnections.length} orphan connections removed`, orphanConnections);

        const newPart = produce(part, (draft) => {
          draft.connections = part.connections.filter((conn) => !orphanConnections.includes(conn));
        });
        onChange(newPart, functionalChange("prune orphan connections"));
      }
    }, [instances, onChange, connections, resolvedFlow, part]);

    useEffect(() => {
      const instanceMap = new Map(instances.map((ins) => [ins.id, ins]));
      instancesConnectToPinsRef.current = connections.reduce((m, conn) => {
        const v = m.get(conn.to.insId) || {};

        const p = v[conn.to.pinId] || [];
        const newV = {
          ...v,
          [conn.to.pinId]: [...p, instanceMap.get(conn.from.insId)],
        };
        m.set(conn.to.insId, newV);
        return m;
      }, new Map());
    }, [connections, instances]);

    const onCloseQuickAdd = React.useCallback(() => {
      setQuickAddMenuVisible(undefined);
    }, []);

    const onQuickAdd = React.useCallback(
      (match: QuickMenuMatch) => {
        if (!quickAddMenuVisible) {
          throw new Error("impossible state - quick add menu invoked but not available");
        }

        const { ins, pos, pinId } = quickAddMenuVisible;

        if (match.type === "part") {
          const newPartIns = createNewPartInstance(match.part.id, 100, lastMousePos.current, repo);

          if (newPartIns) {
            const newValue = produce(part, (draft) => {
              draft.instances.push(newPartIns);
              draft.connections.push({
                from: { insId: ins ? ins.id : THIS_INS_ID, pinId },
                to: { insId: newPartIns.id, pinId: match.pinId },
              });
            });

            onChange(newValue, functionalChange("add-item-quick-menu"));
            onCloseQuickAdd();
          }
        } else {
          if (!ins) {
            toastMsg("Cannot add value to main input");
            return;
          }
          toastMsg('TODO');
          // editOrCreateConstValue(ins, pinId, "n/a", pos, true);
        }
      },
      [quickAddMenuVisible, resolvedFlow, part, onChange, onCloseQuickAdd]
    );

    const copyPartToClipboard = React.useCallback(async () => {
      const str = JSON.stringify(part);
      await navigator.clipboard.writeText(str);
      AppToaster.show({ message: "Copied!" });
    }, [part]);

    const getContextMenu = React.useCallback(
      (pos: Pos) => {
        const maybeDisabledLabel = partIoEditable ? "" : " (cannot edit main part, only grouped)";

        return (
          <Menu>
            <MenuItem
              onMouseDown={(e) => e.stopPropagation()}
              label={"New Value"}
              onClick={preventDefaultAnd(() => toastMsg('TODO') /*requestNewConstValue(pos)*/)}
            />
            <MenuItem
              label={`New input ${maybeDisabledLabel}`}
              onMouseDown={(e) => e.stopPropagation()}
              onClick={preventDefaultAnd(() => onAddIoPin("input"))}
              disabled={!partIoEditable}
            />
            <MenuItem
              onMouseDown={(e) => e.stopPropagation()}
              label={`New output ${maybeDisabledLabel}`}
              onClick={preventDefaultAnd(() => onAddIoPin("output"))}
              disabled={!partIoEditable}
            />
            <MenuItem
              onMouseDown={(e) => e.stopPropagation()}
              label={"Copy part to clipboard"}
              onClick={preventDefaultAnd(copyPartToClipboard)}
            />
            <MenuItem
              onMouseDown={(e) => e.stopPropagation()}
              label={"New Value"}
              onClick={preventDefaultAnd(() => toastMsg('TODO') /*requestNewConstValue(pos)*/)}
            />
            <MenuItem
              onMouseDown={(e) => e.stopPropagation()}
              label={`Edit Completion Outputs (${part.completionOutputs?.join(",") || "n/a"})`}
              onClick={preventDefaultAnd(() => editCompletionOutputs())}
            />

            <MenuItem
              onMouseDown={(e) => e.stopPropagation()}
              label={`Edit Reactive inputs (${part.reactiveInputs?.join(",") || "n/a"})`}
              onClick={preventDefaultAnd(() => editReactiveInputs())}
            />
          </Menu>
        );
      },
      [
        copyPartToClipboard,
        onAddIoPin,
        partIoEditable,
        editCompletionOutputs,
        part,
        editReactiveInputs,
      ]
    );

    const showContextMenu = React.useCallback(
      (e: any) => {
        e.preventDefault();
        const pos = domToViewPort({ x: e.clientX, y: e.clientY }, viewPort);
        const menu = getContextMenu(pos);
        ContextMenu.show(menu, { left: e.clientX, top: e.clientY });
      },
      [getContextMenu, viewPort]
    );

    const onSlide = React.useCallback(
      (v) => setViewPort({ ...viewPort, zoom: v }),
      [setViewPort, viewPort]
    );

    useHotkeys("shift+c", fitToScreen);
    useHotkeys("cmd+c", onCopyInner);
    useHotkeys("cmd+v", onPaste);
    useHotkeys("esc", clearSelections);
    useHotkeys("backspace", deleteInstance);
    useHotkeys("shift+g", onGroupSelectedInternal);
    useHotkeys("shift+d", duplicate);
    useHotkeys("cmd+a", selectAll);
    useHotkeys("s", selectClosest);

    const onChangeInspected: GroupedPartEditorProps["onChangePart"] = React.useCallback(
      (data, type) => {
        if (type.type === "meta") {
          setInspectedInstance((val) => ({ ...val, part: data }));
        } else {
          toastMsg("Cannot change inspected part");
        }
      },
      []
    );

    const [inspectedBoardData, setInspectedBoardData] = useState<GroupEditorBoardData>({
      selected: [],
      viewPort: defaultViewPort,
      lastMousePos: { x: 0, y: 0 },
    });

    const onChangeInspectedBoardData = React.useCallback((partial) => {
      return setInspectedBoardData((data) => ({ ...data, ...partial }));
    }, []);

    const maybeRenderInlinePartInstance = () => {
      if (inspectedInstance) {
        return (
          <div className="inspected-part-container">
            <Button className="close-btn" onClick={() => setInspectedInstance(undefined)}>
              Close
            </Button>
            <GroupedPartEditor
              insId={`${thisInsId}.${inspectedInstance.insId}`}
              boardData={inspectedBoardData}
              onChangeBoardData={onChangeInspectedBoardData}
              resolvedFlow={resolvedFlow}
              onCopy={onCopy}
              clipboardData={props.clipboardData}
              onInspectPin={props.onInspectPin}
              onEditPart={props.onEditPart}
              partIoEditable={props.partIoEditable}
              // requestNewConstValue={props.requestNewConstValue}
              // onGroupSelected={noop}
              onRequestHistory={onRequestHistory}
              // editOrCreateConstValue={props.editOrCreateConstValue}
              part={inspectedInstance.part}
              onChangePart={onChangeInspected}
              onNewEnvVar={props.onNewEnvVar}
              onCommand={noop}
              onShowOmnibar={onShowOmnibar}
            />
          </div>
        );
      } else {
        return null;
      }
    };

    const maybeGetFutureConnection = () => {
      if (
        from &&
        (closestPin?.type === "input" ||
          (closestPin?.ins.id === part.id && closestPin?.type === "output"))
      ) {
        const to: ConnectionNode =
          closestPin.ins.id === part.id
            ? { pinId: closestPin.pin, insId: THIS_INS_ID }
            : { insId: closestPin.ins.id, pinId: closestPin.pin };

        if (!isInternalConnectionNode(to) && !isInternalConnectionNode(from)) {
          // hack to fix the fact main output / main input could connect to each other
          return;
        }
        return { from, to };
      } else if (
        to &&
        (closestPin?.type === "output" ||
          (closestPin?.ins.id === part.id && closestPin?.type === "input"))
      ) {
        const from: ConnectionNode =
          closestPin.ins.id === part.id
            ? { pinId: closestPin.pin, insId: THIS_INS_ID }
            : { insId: closestPin.ins.id, pinId: closestPin.pin };

        if (!isInternalConnectionNode(to) && !isInternalConnectionNode(from)) {
          // hack to fix the fact main output / main input could connect to each other
          return;
        }

        return { from, to };
      }
    };

    const maybeRenderFutureConnection = () => {
      const maybeFutureConnection = maybeGetFutureConnection();
      if (maybeFutureConnection) {
        const { from, to } = maybeFutureConnection;
        const existing = new Set(
          connections.map((c) => `${c.from.insId}|${c.from.pinId}|${c.to.insId}|${c.to.pinId}`)
        );
        const cstr = `${from.insId}|${from.pinId}|${to.insId}|${to.pinId}`;

        return (
          <ConnectionView
            from={from}
            to={to}
            repo={repo}
            parentInsId={thisInsId}
            size={vpSize}
            part={part}
            boardPos={boardPos}
            instances={instances}
            key={"future-conn"}
            onDblClick={noop}
            future={existing.has(cstr) ? "removal" : "addition"}
            viewPort={viewPort}
          />
        );
      }
    };

    const onChangeVisibleInputs = React.useCallback(
      (ins: PartInstance, inputs: string[]) => {
        const newPart = produce(part, (draft) => {
          draft.instances = draft.instances.map((i) => {
            return i.id === ins.id ? { ...i, visibleInputs: inputs } : i;
          });
        });
        onChange(newPart, functionalChange("change instance visible inputs"));
      },
      [part, onChange]
    );

    const onChangeVisibleOutputs = React.useCallback(
      (ins: PartInstance, outputs: string[]) => {
        const newPart = produce(part, (draft) => {
          draft.instances = draft.instances.map((i) => {
            return i.id === ins.id ? { ...i, visibleOutputs: outputs } : i;
          });
        });
        onChange(newPart, functionalChange("change instance visible outputs"));
      },
      [part, onChange]
    );
    // The component instance will be extended
    // with whatever you return from the callback passed
    // as the second argument
    React.useImperativeHandle(ref, () => ({
      centerInstance(insId: string) {
        const ins = part.instances.find((ins) => ins.id === insId);
        if (ins) {
          const pos = vSub(ins.pos, vec(vpSize.width / 2, vpSize.height / 2));
          setViewPort({ ...viewPort, pos });
        }
      },
      centerViewPort() {
        fitToScreen();
      },
      getViewPort() {
        return viewPort;
      },
      clearSelection: () => {
        clearSelections();
      },
    }));

    const onChangeInstanceConfig = React.useCallback(
      (instance: PartInstance, comment: string) => {
        const config: PartInstanceConfig = {
          visibleInputs: instance.visibleInputs,
          visibleOutputs: instance.visibleOutputs,
          inputConfig: instance.inputConfig,
          displayName: instance.displayName,
        };
        const newPart = produce(part, (draft) => {
          draft.instances = draft.instances.map((i) => {
            return i.id === instance.id ? { ...i, ...config } : i;
          });
        });
        onChange(newPart, functionalChange("change instance config - " + comment));
      },
      [onChange, part]
    );

    // use this to debug positioning/layout related stuff
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [layoutDebuggers, setLayoutDebuggers] = React.useState<
      Array<Omit<LayoutDebuggerProps, "viewPort">>
    >([]);

    const maybeRenderInstancePanel = () => {
      if (selected.length === 1) {
        const instance = part.instances.find((ins) => ins.id === selected[0]);
        if (!instance) {
          throw new Error("Selected instance not found");
        }
        const insPart = getPartDef(instance, repo);
        if (!insPart) {
          throw new Error("Selected instance part not found");
        }

        const connections = part.connections.filter(
          (c) => c.from.insId === instance.id || c.to.insId === instance.id
        );

        return (
          <InstancePanel
            instance={instance}
            part={insPart}
            connections={connections}
            onChangeInstanceConfig={onChangeInstanceConfig}
          />
        );
      }

      return null;
    };

    const onSaveInlineCodePart = React.useCallback((type: CodePartTemplateTypeInline, code: string) => {
      const [existingInlinePart] = part.instances
        .filter(ins => ins.id === inlineCodeTarget.insId)
        .filter(ins => isInlinePartInstance(ins))
        .map((ins: InlinePartInstance) => ins.part);
      
      if (!existingInlinePart) {
        throw new Error(`Unable to find inline part to save to`);
      }

      const customView = code.trim().substr(0, 100);
      const partId = `Inline-value-${customView.substr(0, 15).replace(/["'`]/g, '')}`

      const newPart = createInlineCodePart({
        code,
        customView,
        partId,
        type,
      });

      const oldInputs = keys(existingInlinePart.inputs);
      const newInputs = keys(newPart.inputs);

      const removedInputs = new Set(_.difference(oldInputs, newInputs));

      const newVal = produce(part, draft => {
        draft.instances = draft.instances.map(i => {
          return i.id === inlineCodeTarget.insId ? inlinePartInstance(i.id, newPart, i.inputConfig, i.pos) : i;
        });
        draft.connections = draft.connections.filter((conn) => {
          const wasRemoved = conn.to.insId === inlineCodeTarget.insId && removedInputs.has(conn.to.pinId);
          return !wasRemoved;
        })
      });

      onChange(newVal, functionalChange('change inline value'));

      setInlineCodeTarget(undefined);
        
    }, [inlineCodeTarget, onChange, part])

    try {
      return (
        <div className="grouped-part-editor" data-id={part.id} onContextMenu={showContextMenu}>
          <main
            className="board-editor-inner"
            // onWheel={onMaybeZoom}
            onMouseDown={onMouseDown}
            onMouseUp={onMouseUp}
            onMouseMove={onMouseMove}
            onMouseLeave={onMouseLeave}
            ref={boardRef as any}
            style={backgroundStyle}
          >
            <React.Fragment>
              {layoutDebuggers.map((p, i) => (
                <LayoutDebugger viewPort={viewPort} {...p} key={i} />
              ))}
            </React.Fragment>
            {/* <div className='debug-info'>
              <span className='viewport'>
                {`${viewPort.pos.x.toFixed(2)}, ${viewPort.pos.y.toFixed(2)} | ${viewPort.zoom}`}
              </span>
            </div> */}

            {connections
              .filter((conn) => {
                // do not render on top of a future connection so it shows removal properly
                const fConn = maybeGetFutureConnection();
                if (!fConn) {
                  return true;
                }
                return !connectionDataEquals(fConn, conn);
              })
              .map((v, i) => (
                <ConnectionView
                  repo={repo}
                  parentInsId={thisInsId}
                  size={vpSize}
                  part={part}
                  boardPos={boardPos}
                  instances={instances}
                  from={v.from}
                  to={v.to}
                  key={i}
                  onDblClick={noop}
                  viewPort={viewPort}
                />
              ))}
            {maybeRenderFutureConnection()}
            {renderPartInputs()}
            {instances.map((v) => (
              <InstanceView
                onDismantleGroup={onDismantleGroup}
                onDetachConstValue={onDetachConstValue}
                onCopyConstValue={onCopyConstValue}
                onPasteConstValue={onPasteConstValue}
                copiedConstValue={copiedConstValue}
                connectionsPerInput={instancesConnectToPinsRef.current.get(v.id) || emptyObj}
                connectionsPerOutput={emptyObj}
                part={getPartDef(v, repo)}
                parentInsId={thisInsId}
                onPinClick={onPinClick}
                onPinDblClick={onPinDblClick}
                onDragStart={onStartDragging}
                onDragEnd={onDragEnd}
                partDefRepo={repo}
                onDragMove={onDragMove}
                onDblClick={onDblClickInstance}
                onSelect={onSelectInstance}
                onToggleSticky={onToggleSticky}
                selected={selected.indexOf(v.id) !== -1}
                dragged={draggingId === v.id}
                onInspectPin={_onInspectPin}
                onConvertConstToEnv={props.onNewEnvVar ? onConvertConstToEnv : undefined}
                selectedInput={
                  to && isInternalConnectionNode(to) && to.insId === v.id ? to.pinId : undefined
                }
                selectedOutput={
                  from && isInternalConnectionNode(from) && from.insId === v.id
                    ? from.pinId
                    : undefined
                }
                closestPin={closestPin && closestPin.ins.id === v.id ? closestPin : undefined}
                instance={v}
                connections={connections}
                // was too lazy to remove/fix the breakpoint/log below
                onTogglePinBreakpoint={noop}
                onTogglePinLog={noop}
                // onTogglePinLog={onToggleLog}
                // onTogglePinBreakpoint={onToggleBreakpoint}
                viewPort={viewPort}
                onRequestHistory={_onRequestHistory}
                onChangeVisibleInputs={onChangeVisibleInputs}
                onChangeVisibleOutputs={onChangeVisibleOutputs}
                key={v.id}
                forceShowMinimized={from ? "input" : to ? "output" : undefined}
              />
            ))}
            {maybeDrawSelectionBox()}
            {/* {maybeRenderEditGroupModal()} */}
            {renderPartOutputs()}
            {quickAddMenuVisible ? (
              <QuickAddMenu {...quickAddMenuVisible} onAdd={onQuickAdd} onClose={onCloseQuickAdd} />
            ) : null}
            <div className="zoom-slider">
              <MemodSlider
                min={0.05}
                max={3}
                stepSize={0.05}
                labelStepSize={10}
                labelRenderer={sliderRenderer}
                onChange={onSlide}
                value={viewPort.zoom}
              />
            </div>
            {inlineCodeTarget ? (
              <InlineCodeModal
                env={emptyObj}
                initialValue={inlineCodeTarget.value}
                initialType={inlineCodeTarget.templateType}
                onCancel={() => setInlineCodeTarget(undefined)}
                onSubmit={onSaveInlineCodePart}
              />
            ) : null}
          </main>
          {maybeRenderInlinePartInstance()}
          {maybeRenderInstancePanel()}
        </div>
      );
    } catch (e) {
      console.error(e);
      return <div>Error rendering board - {(e as any).toString()}</div>;
    }
  })
);
