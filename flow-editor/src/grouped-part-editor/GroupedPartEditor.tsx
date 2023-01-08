import * as React from "react";
import cuid from "cuid";

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
  PartInstanceConfig,
  delay,
  noop,
  keys,
  TRIGGER_PIN_ID,
  ImportablePart,
  inlinePartInstance,
  isInlinePartInstance,
  isRefPartInstance,
  InlineValuePartType,
  isInlineValuePart,
  InlinePartInstance,
  ResolvedFlydeFlowDefinition,
  connectionNode,
  ImportedPartDef,
  ERROR_PIN_ID,
  PartStyle,
  getPartOutputs,
  Pos,
} from "@flyde/core";
import { InstanceView } from "./instance-view/InstanceView";
import {
  ConnectionView,
  ConnectionViewProps,
} from "./connection-view/ConnectionView";
import { entries, isDefined, preventDefaultAnd, Size } from "../utils";
import { useBoundingclientrect, useDidMount } from "rooks";

import {
  toggleStickyPin,
  findClosestPin,
  getSelectionBoxRect,
  emptyObj,
  createNewPartInstance,
  ViewPort,
  domToViewPort,
  roundNumber,
  fitViewPortToPart,
  getInstancesInRect,
  handleInstanceDrag,
  handleIoPinRename,
  handleChangePartInputType,
  calcSelectionBoxArea,
  centerBoardPosOnTarget,
  emptyList,
} from "./utils";

import { produce } from "immer";
import { useState, useRef, useEffect } from "react";
import { useHotkeys } from "../lib/react-utils/use-hotkeys";
import useComponentSize from "@rehooks/component-size";

import {
  Slider,
  Menu,
  MenuItem,
  ContextMenu,
  MenuDivider,
  Button,
} from "@blueprintjs/core";
import { PartIoView, PartIoType } from "./part-io-view";

import { vAdd, vec, vSub, vZero } from "../physics";
import {
  QuickAddMenu,
  QuickAddMenuData,
  QuickMenuMatch,
} from "./quick-add-menu";
import { queueInputPinConfig } from "@flyde/core";
import { HistoryPayload } from "@flyde/remote-debugger";
import { orderGroupedPart } from "./order-layout/cmd";
import { LayoutDebugger, LayoutDebuggerProps } from "./layout-debugger";
import { preloadMonaco } from "../lib/preload-monaco";
// import { InstancePanel } from "./instance-panel";
import { toastMsg, AppToaster } from "../toaster";
import {
  FlydeFlowChangeType,
  functionalChange,
  metaChange,
} from "../flow-editor/flyde-flow-change-type";
import { InlineCodeModal } from "../flow-editor/inline-code-modal";
import { createInlineValuePart } from "../flow-editor/inline-code-modal/inline-code-to-part";
import _ from "lodash";
import { groupSelected } from "../group-selected";
import { useConfirm, usePrompt } from "../flow-editor/ports";
import classNames from "classnames";
import { pasteInstancesCommand } from "./commands/paste-instances";
import { animateViewPort, logicalPosToRenderedPos } from "..";
import { handleConnectionCloseEditorCommand } from "./commands/close-connection";
import { handleDetachConstEditorCommand } from "./commands/detach-const";
import { handleDuplicateSelectedEditorCommand } from "./commands/duplicate-instances";
import { PartStyleMenu } from "./instance-view/PartStyleMenu";
import { FlydeFlowEditorProps } from "../flow-editor/FlowEditor";
import { access } from "node:fs";

const MemodSlider = React.memo(Slider);

const sliderRenderer = (p: any) => null;

export const PART_HEIGHT = 28;
const DBL_CLICK_TIME = 300;

export const defaultViewPort: ViewPort = {
  pos: { x: 0, y: 0 },
  zoom: 1,
};

export const defaultBoardData: GroupEditorBoardData = {
  selected: [],
  viewPort: defaultViewPort,
  lastMousePos: { x: 0, y: 0 },
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

  onGoToPartDef: (part: ImportedPartDef) => void;

  // onGroupSelected: () => void;
  onRequestHistory: (
    insId: string,
    pinId: string,
    pinType: PinType
  ) => Promise<HistoryPayload>;
  onRequestImportables?: (query: string) => Promise<ImportablePart[]>;

  onImportPart: FlydeFlowEditorProps["onImportPart"];

  onExtractInlinePart: (instance: InlinePartInstance) => Promise<void>;

  onShowOmnibar: (e: any) => void;

  className?: string;

  parentViewport?: ViewPort;
  parentBoardPos?: Pos;
};

type InlineValueTargetExisting = {
  insId: string;
  value: string;
  templateType: InlineValuePartType;
  type: "existing";
};
type InlineValueTargetNewStatic = {
  insId: string;
  pinId: string;
  value?: string;
  type: "static-input";
};
type InlineValueTargetNewFloating = {
  pos: Pos;
  type: "new-floating";
  value?: string;
};
type InlineValueTargetNewOutput = {
  insId: string;
  pinId: string;
  type: "new-output";
  value?: string;
};

type InlineValueTarget =
  | InlineValueTargetExisting
  | InlineValueTargetNewStatic
  | InlineValueTargetNewFloating
  | InlineValueTargetNewOutput;

export const GroupedPartEditor: React.FC<
  GroupedPartEditorProps & { ref?: any }
> = React.memo(
  React.forwardRef((props, thisRef) => {
    const {
      onChangePart: onChange,
      partIoEditable,
      onCopy,
      // onToggleLog,
      // onToggleBreakpoint,
      onGoToPartDef: onEditPart,
      // editOrCreateConstValue,
      // requestNewConstValue,
      onRequestHistory,
      onInspectPin,
      boardData,
      onChangeBoardData,
      insId: thisInsId,
      part,
      onShowOmnibar,
      resolvedFlow,
      onImportPart,
    } = props;

    const parentViewport = props.parentViewport || defaultViewPort;

    const [repo, setRepo] = useState({
      ...resolvedFlow.dependencies,
      [resolvedFlow.main.id]: resolvedFlow.main,
    });

    useEffect(() => {
      setRepo({
        ...resolvedFlow.dependencies,
        [resolvedFlow.main.id]: resolvedFlow.main,
      });
    }, [resolvedFlow]);

    const { selected, from, to } = boardData;
    const {
      instances,
      connections,
      inputsPosition,
      outputsPosition,
      inputs,
      outputs,
    } = part;

    // hooks area
    const [draggingId, setDraggingId] = useState<string>();
    const [selectionBox, setSelectionBox] = useState<{ from: Pos; to: Pos }>();

    const [lastBoardClickTime, setLastBoardClickTime] = useState<number>(0);

    const [lastSelectedId, setLastSelectedId] = useState<string>(); // to avoid it disappearing when doubling clicking to edit

    const [didCenterInitially, setDidCenterInitially] = useState(false);

    const [quickAddMenuVisible, setQuickAddMenuVisible] =
      useState<QuickAddMenuData>();

    const [copiedConstValue, setCopiedConstValue] = useState<any>();

    const [inlineCodeTarget, setInlineCodeTarget] =
      useState<InlineValueTarget>();

    const [openInlineInstance, setOpenInlineInstance] = useState<{
      part: GroupedPart;
      insId: string;
    }>();

    const inlineEditorPortalRootRef = useRef();

    useDidMount(() => {
      inlineEditorPortalRootRef.current = boardRef.current.querySelector(
        ".inline-editor-portal-root"
      );
    });

    const _confirm = useConfirm();
    const _prompt = usePrompt();

    const viewPort = boardData.viewPort;

    const isBoardInFocus = useRef(true);

    const setViewPort = React.useCallback(
      (viewPort) => {
        onChangeBoardData({ viewPort });
      },
      [onChangeBoardData]
    );

    const _onRequestHistory: GroupedPartEditorProps["onRequestHistory"] =
      React.useCallback(
        (insId, pinId, pinType) => {
          return onRequestHistory(insId, pinId, pinType);
        },
        [onRequestHistory]
      );

    const _onInspectPin: GroupedPartEditorProps["onInspectPin"] =
      React.useCallback(
        (insId, pinId, pinType) => {
          return onInspectPin(`${thisInsId}.${insId}`, pinId, pinType);
        },
        [onInspectPin, thisInsId]
      );

    const onConnectionClose = React.useCallback(
      (from: ConnectionNode, to: ConnectionNode) => {
        const newPart = handleConnectionCloseEditorCommand(part, { from, to });

        const maybeIns = isInternalConnectionNode(to)
          ? instances.find((i) => i.id === to.insId)
          : null;
        const inputConfig = maybeIns ? maybeIns.inputConfig : {};
        const pinConfig = inputConfig[to.pinId];
        const isTargetStaticValue = isStaticInputPinConfig(pinConfig);

        const maybeDetachedPart = isTargetStaticValue
          ? handleDetachConstEditorCommand(newPart, to.insId, to.pinId)
          : newPart;

        onChange(maybeDetachedPart, functionalChange("close-connection"));
        onChangeBoardData({ from: undefined, to: undefined });
      },
      [instances, onChange, onChangeBoardData, part]
    );

    const onGroupSelectedInternal = React.useCallback(async () => {
      const name = await _prompt("New grouped part name?");
      const { currentPart } = await groupSelected(
        boardData.selected,
        part,
        name,
        "inline",
        _prompt
      );
      onChange(currentPart, functionalChange("group part"));

      toastMsg("Part grouped!");
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

    const boardPos = useBoundingclientrect(boardRef) || vZero;

    const fitToScreen = () => {
      const vp = fitViewPortToPart(part, repo, vpSize);

      animateViewPort(viewPort, vp, 500, (vp) => {
        setViewPort(vp);
      });
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

    const onPartIoSetDescription = React.useCallback(
      (type: PinType, pinId: string, description: string) => {
        const newPart = produce(part, (draft) => {
          if (type === "input") {
            draft.inputs[pinId].description = description;
          } else {
            draft.outputs[pinId].description = description;
          }
        });
        onChange(newPart, functionalChange("Part io description"));
      },
      [onChange, part]
    );

    const onPinClick = React.useCallback(
      (ins: PartInstance, pinId: string, type: PinType) => {
        const { from: currFrom, to: currTo } = boardData;

        if ((from && from.insId === ins.id) || (to && to.insId === ins.id)) {
          // trying to connect the same instance to itself, so clear selection
          onChangeBoardData({ from: undefined, to: undefined });
        } else if (type === "input") {
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
            onChangeBoardData({ to, selected: [] });
          }
        } else {
          const from = { insId: ins.id, pinId };

          if (
            currFrom &&
            currFrom.pinId === pinId &&
            (isInternalConnectionNode(currFrom)
              ? currFrom.insId === ins.id
              : true)
          ) {
            onChangeBoardData({ from: undefined });
          } else if (to) {
            onConnectionClose(from, to);
          } else {
            onChangeBoardData({ from, selected: [] });
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
    }, [
      part,
      vpSize,
      props.thumbnailMode,
      didCenterInitially,
      repo,
      setViewPort,
    ]);

    const onCopyInner = React.useCallback(() => {
      const { selected } = boardData;
      const instances = part.instances
        .filter((ins) => selected.includes(ins.id))
        .map((ins) => ({ ...ins, id: ins.id + "-copy" }));
      const connections = part.connections.filter(({ from, to }) => {
        return selected.includes(from.insId) && selected.includes(to.insId);
      });
      onCopy({ instances, connections });
    }, [boardData, onCopy, part]);

    const onPaste = React.useCallback(() => {
      const { newPart, newInstances } = pasteInstancesCommand(
        part,
        lastMousePos.current,
        props.clipboardData
      );
      onChange(newPart, functionalChange("paste instances"));

      onChangeBoardData({ selected: newInstances.map((ins) => ins.id) });
    }, [onChange, onChangeBoardData, part, props.clipboardData]);

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

    const onZoom = React.useCallback(
      (newZoom: number, source?: "hotkey" | "mouse") => {
        // const pos = vDiv(viewPort.pos, (newZoom - viewPort.zoom));
        // console.log({viewPort, pos});

        const targetPos =
          source === "mouse"
            ? lastMousePos.current
            : {
                x: viewPort.pos.x + vpSize.width / 2,
                y: viewPort.pos.y + vpSize.height / 2,
              };
        const newPos = centerBoardPosOnTarget(
          targetPos,
          vpSize,
          newZoom,
          viewPort
        );

        // const newCenter = centerBoardPosOnTarget(lastMousePos.current, vpSize, newZoom, viewPort);
        setViewPort({ ...viewPort, zoom: newZoom, pos: newPos });
      },
      [setViewPort, viewPort, vpSize]
    );

    useHotkeys(
      "cmd+=",
      (e: any) => {
        onZoom(viewPort.zoom + 0.1, "hotkey");
        e.preventDefault();
      },
      isBoardInFocus,
      [viewPort, onZoom]
    );

    useHotkeys(
      "cmd+-",
      (e) => {
        onZoom(viewPort.zoom - 0.1, "hotkey");
        e.preventDefault();
      },
      isBoardInFocus,
      [onZoom, viewPort.zoom]
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
      isBoardInFocus,
      [onChange, part, resolvedFlow]
    );

    useHotkeys(
      "cmd+0",
      (e) => {
        onZoom(1);
        e.preventDefault();
      },
      isBoardInFocus,
      [viewPort, onZoom]
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
        // event.preventDefault();
        // event.stopPropagation();
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
        const newSelectedIfSelectionIsNew = ev.shiftKey
          ? [...selected, id]
          : [id];
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

    const onDeleteInstances = React.useCallback(
      (ids: string[]) => {
        const newConnections = connections.filter(({ from, to }) => {
          return ids.indexOf(from.insId) === -1 && ids.indexOf(to.insId) === -1;
        });

        const newValue = produce(part, (draft) => {
          draft.connections = newConnections;
          draft.instances = draft.instances.filter(
            (_ins) => !ids.includes(_ins.id)
          );
        });

        onChange(newValue, functionalChange("delete-ins"));
        onChangeBoardData({ selected: [] });
      },
      [connections, onChange, onChangeBoardData, part]
    );

    const onDeleteInstance = React.useCallback(
      (ins: PartInstance) => {
        onDeleteInstances([ins.id]);
      },
      [onDeleteInstances]
    );

    const onRemoveIoPin = React.useCallback(
      (type: PartIoType, pinId: string) => {
        const newValue = produce(part, (draft) => {
          if (type === "input") {
            delete draft.inputs[pinId];
            draft.connections = draft.connections.filter(
              (conn) =>
                !(
                  isExternalConnectionNode(conn.from) &&
                  conn.from.pinId === pinId
                )
            );
          } else {
            draft.connections = draft.connections.filter(
              (conn) =>
                !(isExternalConnectionNode(conn.to) && conn.to.pinId === pinId)
            );
            draft.completionOutputs = (draft.completionOutputs || [])
              .map((comp) => {
                const arr = comp.split("+"); // due to the r1+r1,r3 hack, see core tests
                return arr.filter((pin) => pin !== pinId).join("+");
              })
              .filter((i) => !!i);
            delete draft.outputs[pinId];
          }
        });

        if (from.insId === THIS_INS_ID && from.pinId === pinId) {
          onChangeBoardData({ from: undefined });
        } else if (to.insId === THIS_INS_ID && to.pinId === pinId) {
          onChangeBoardData({ to: undefined });
        }

        onChange(newValue, functionalChange("remove io pin"));
      },
      [part, from, to, onChange, onChangeBoardData]
    );

    const deleteSelection = React.useCallback(async () => {
      const { selected, from, to } = boardData;
      if (selected.length === 0) {
        if (isExternalConnectionNode(from)) {
          if (
            await _confirm(
              `Are you sure you want to remove main input ${from.pinId}?`
            )
          ) {
            onRemoveIoPin("input", from.pinId);
          }
        } else if (isExternalConnectionNode(to)) {
          if (
            await _confirm(
              `Are you sure you want to remove main output ${to.pinId}?`
            )
          ) {
            onRemoveIoPin("output", to.pinId);
          }
        }
      } else {
        onDeleteInstances(selected);
      }
    }, [_confirm, boardData, onDeleteInstances, onRemoveIoPin]);

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
      const { newPart, newInstances } = handleDuplicateSelectedEditorCommand(
        part,
        selected
      );

      onChange(newPart, functionalChange("duplicated instances"));
      onChangeBoardData({ selected: newInstances.map((ins) => ins.id) });
      // onChange(duplicateSelected(value), functionalChange("duplicate"));
    }, [onChange, onChangeBoardData, part, selected]);

    const onMouseDown: React.MouseEventHandler = React.useCallback(
      (e) => {
        const target = e.nativeEvent.target as HTMLElement;

        if (e.button !== 0) {
          // right click
          return;
        }
        if (!isEventOnCurrentBoard(e.nativeEvent, part.id)) {
          return;
        }

        if (target && target.className === "board-editor-inner") {
          // dbl click and onMouseDown did not work, so we use onMouseDown to detect double click
          if (Date.now() - lastBoardClickTime < DBL_CLICK_TIME) {
            onShowOmnibar(e);
            return;
          }
          setLastBoardClickTime(Date.now());
          const eventPos = { x: e.clientX, y: e.clientY };
          const normalizedPos = vSub(eventPos, boardPos);
          const posInBoard = domToViewPort(
            normalizedPos,
            viewPort,
            parentViewport
          );
          setSelectionBox({ from: posInBoard, to: posInBoard });
        }
      },
      [
        part.id,
        viewPort,
        lastBoardClickTime,
        boardPos,
        parentViewport,
        onShowOmnibar,
      ]
    );

    const onMouseUp: React.MouseEventHandler = React.useCallback(
      (e) => {
        if (!isEventOnCurrentBoard(e.nativeEvent, part.id)) {
          return;
        }
        if (selectionBox) {
          if (calcSelectionBoxArea(selectionBox) > 50) {
            const toSelect = getInstancesInRect(
              selectionBox,
              repo,
              viewPort,
              instancesConnectToPinsRef.current,
              part.instances,
              boardPos,
              parentViewport
            );
            console.log({ toSelect, selectionBox });

            const newSelected = e.shiftKey
              ? [...selected, ...toSelect]
              : toSelect;
            onChangeBoardData({ selected: newSelected });
          }

          setSelectionBox(undefined);
        }
      },
      [
        part.id,
        part.instances,
        selectionBox,
        repo,
        viewPort,
        boardPos,
        parentViewport,
        selected,
        onChangeBoardData,
      ]
    );

    const onMouseMove: React.MouseEventHandler = React.useCallback(
      (e) => {
        if (!isEventOnCurrentBoard(e.nativeEvent, part.id)) {
          isBoardInFocus.current = false;
          return;
        }
        isBoardInFocus.current = true;

        const eventPos = { x: e.clientX, y: e.clientY };
        const normalizedPos = vSub(eventPos, vAdd(boardPos, vZero));
        const posInBoard = domToViewPort(
          normalizedPos,
          viewPort,
          parentViewport
        );

        // const posInBoard = normal; //domToViewPort(eventPos, viewPort);

        // console.log({bpy: boardPos.y, ny: normal.y, epy: eventPos.y, py: posInBoard.y});

        if (selectionBox) {
          setSelectionBox({ ...selectionBox, to: posInBoard });
        }

        const closest = findClosestPin(
          part,
          repo,
          normalizedPos,
          boardPos,
          thisInsId,
          viewPort
        );
        const currClosest = closestPin;
        if (closest) {
          const isNewClosest =
            !currClosest ||
            currClosest.ins !== closest.ins ||
            (currClosest.ins === closest.ins &&
              currClosest.pin !== closest.pin);
          if (isNewClosest) {
            setClosestPin({
              ins: closest.ins,
              type: closest.type,
              pin: closest.id,
            });
          }
        }

        lastMousePos.current = posInBoard;
        onChangeBoardData({ lastMousePos: lastMousePos.current });
      },
      [
        part,
        boardPos,
        viewPort,
        parentViewport,
        selectionBox,
        repo,
        thisInsId,
        closestPin,
        onChangeBoardData,
      ]
    );

    const onMouseLeave: React.MouseEventHandler = React.useCallback(() => {
      setClosestPin(undefined);
      isBoardInFocus.current = false;
    }, []);

    const onDblClickInstance = React.useCallback(
      (ins: PartInstance, shift: boolean) => {
        if (shift) {
          const part = isInlinePartInstance(ins)
            ? ins.part
            : getPartDef(ins.partId, repo);
          if (!part) {
            throw new Error(`Impossible state inspecting inexisting part`);
          }
          if (!isGroupedPart(part)) {
            toastMsg("Cannot inspect a non visual part", "warning");
            //`Impossible state inspecting grouped part`);
            return;
          }

          setOpenInlineInstance({ insId: `${thisInsId}.${ins.id}`, part });
        } else {
          if (isRefPartInstance(ins)) {
            const part = getPartDef(ins, repo);

            onEditPart(part as ImportedPartDef);
          } else {
            const part = ins.part;
            if (!isInlineValuePart(part)) {
              if (isGroupedPart(part)) {
                setOpenInlineInstance({ insId: ins.id, part });
              } else {
                toastMsg("Editing this type of part is not supported");
              }
              return;
            }
            const value = atob(part.dataBuilderSource);
            setInlineCodeTarget({
              insId: ins.id,
              templateType: part.templateType,
              value,
              type: "existing",
            });
            toastMsg("Editing inline grouped part not supported yet");
          }
        }
      },
      [onEditPart, repo, thisInsId]
    );

    const onUngroup = React.useCallback(
      (groupPartIns: PartInstance) => {
        if (isInlinePartInstance(groupPartIns)) {
          const groupedPart = groupPartIns.part;
          if (!isGroupedPart(groupedPart)) {
            toastMsg("Not supported", "warning");
            return;
          }

          const newPart = produce(part, (draft) => {
            draft.instances = draft.instances.filter(
              (ins) => ins.id !== groupPartIns.id
            );

            draft.connections = draft.connections.filter(
              ({ from, to }) =>
                from.insId !== groupPartIns.id && to.insId !== groupPartIns.id
            );

            draft.instances.push(...groupedPart.instances);
            draft.connections.push(
              ...groupedPart.connections.filter((conn) => {
                return (
                  isInternalConnectionNode(conn.from) &&
                  isInternalConnectionNode(conn.to)
                );
              })
            );
          });

          onChange(newPart, { type: "functional", message: "ungroup" });
          // todo - combine the above with below to an atomic action
          onChangeBoardData({ selected: [] });
        } else {
          const groupedPart = getPartDef(groupPartIns.partId, repo);

          // const imports =
          if (!isGroupedPart(groupedPart)) {
            toastMsg("Not supported", "warning");
            return;
          }
        }
      },
      [part, onChange, onChangeBoardData, repo]
    );

    const onExtractInlinePart = React.useCallback(
      async (inlineInstance: InlinePartInstance) => {},
      []
    );

    const onDetachConstValue = React.useCallback(
      (ins: PartInstance, pinId: string) => {
        const newPart = handleDetachConstEditorCommand(part, ins.id, pinId);
        onChange(newPart, functionalChange("detach-const"));
      },
      [onChange, part]
    );

    const onCopyConstValue = React.useCallback(
      (ins: PartInstance, pinId: string) => {
        const config = ins.inputConfig[pinId] || queueInputPinConfig();
        if (isStaticInputPinConfig(config)) {
          setCopiedConstValue(config.value);
          AppToaster.show({ message: "Value copied" });
        }
      },
      []
    );

    const onPasteConstValue = React.useCallback(
      (ins: PartInstance, pinId: string) => {
        const newValue = produce(part, (draft) => {
          const insToChange = draft.instances.find(
            (_ins) => _ins.id === ins.id
          );
          if (!insToChange) {
            throw new Error("Impossible state");
          }
          insToChange.inputConfig[pinId] =
            staticInputPinConfig(copiedConstValue);
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

    const onAddIoPin = React.useCallback(
      async (type: PartIoType) => {
        const newPinId = await _prompt("New name?");

        if (!newPinId) {
          // name selection dismissed, cancelling
          return;
        }
        const newPinType = "any";

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
            // hackily add the new output as required for completion to an existing

            const firstCompletionOutput = (draft.completionOutputs || [])[0];
            if (firstCompletionOutput) {
              const arr = firstCompletionOutput.split("+");
              draft.completionOutputs[0] = [...arr, newPinId].join("+");
            } else {
              draft.completionOutputs = [newPinId];
            }
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
          draft.completionOutputs =
            newVal === "" ? undefined : newVal.split(",");
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

    const editPartDescription = React.useCallback(async () => {
      const description = await _prompt(`Description?`, part.description);
      const newValue = produce(part, (draft) => {
        draft.description = description;
      });

      onChange(newValue, functionalChange("Edit part description"));
    }, [_prompt, onChange, part]);

    const onChangeDefaultStyle = React.useCallback(
      (style: PartStyle) => {
        const newPart = produce(part, (draft) => {
          draft.defaultStyle = style;
        });
        onChange(newPart, functionalChange("change default style"));
      },
      [onChange, part]
    );

    const onRenameIoPin = React.useCallback(
      async (type: PartIoType, pinId: string) => {
        const newName = (await _prompt("New name?", pinId)) || pinId;
        const newValue = handleIoPinRename(part, type, pinId, newName);
        onChange(newValue, functionalChange("rename io pin"));
      },
      [part, onChange, _prompt]
    );

    const onChangeInputMode = React.useCallback(
      (pinId: string, mode: InputMode) => {
        const newValue = handleChangePartInputType(part, pinId, mode);
        onChange(newValue, functionalChange("toggle io pin optional"));
      },
      [part, onChange]
    );

    const _onRequestPartIoHistory = React.useCallback(
      (id, type) => {
        const hackishlyGetInsId = thisInsId.split(".").reverse()[0];
        return onRequestHistory(hackishlyGetInsId, id, type);
      },
      [onRequestHistory, thisInsId]
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
          onSetDescription={onPartIoSetDescription}
          selected={from?.pinId === k}
          description={v.description}
          onRequestHistory={_onRequestPartIoHistory}
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
          onSetDescription={onPartIoSetDescription}
          description={v.description}
          selected={to?.pinId === k}
          onRequestHistory={_onRequestPartIoHistory}
        />
      ));
    };

    const maybeRenderSelectionBox = () => {
      if (selectionBox) {
        const { from, to } = selectionBox;

        const realFrom = logicalPosToRenderedPos(from, viewPort);
        const realTo = logicalPosToRenderedPos(to, viewPort);
        console.log(from.x, to.x, " | ", realFrom.x, realTo.x);

        const { x, y, w, h } = getSelectionBoxRect(realFrom, realTo);

        return (
          <div
            className="selection-box"
            style={{ top: y, left: x, width: w, height: h }}
          />
        );
      } else {
        return null;
      }
    };

    const onPinDblClick = React.useCallback(
      async (
        ins: PartInstance,
        pinId: string,
        type: PinType,
        e: React.MouseEvent
      ) => {
        if (type === "input") {
          const inputConfig = ins.inputConfig[pinId];

          const normalizedValue = isStaticInputPinConfig(inputConfig)
            ? JSON.stringify(inputConfig.value)
            : undefined;

          setInlineCodeTarget({
            type: "static-input",
            insId: ins.id,
            pinId,
            value: normalizedValue,
          });
        } else {
          const part = getPartDef(ins, repo);
          const partOutputs = getPartOutputs(part);
          const pin = partOutputs[pinId];

          if (!pin) {
            throw new Error("Dbl clicked on un-existing pin");
          }

          setQuickAddMenuVisible({
            pos: { x: e.clientX, y: e.clientY },
            ins,
            part,
            pinId,
            pinType: type,
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

        setQuickAddMenuVisible({
          pos: { x: e.clientX, y: e.clientY },
          pinId,
          pinType: "input",
          part,
        });
      },
      [part]
    );

    const onMaybeZoomOrPan = React.useCallback(
      (e: WheelEvent) => {
        if (e.metaKey || e.ctrlKey) {
          const zoomDiff = e.deltaY * -0.005;
          onZoom(viewPort.zoom + zoomDiff, "mouse");
          e.preventDefault();
          e.stopPropagation();
        } else {
          const dx = e.deltaX;
          const dy = e.deltaY;

          const newViewPort = produce(viewPort, (vp) => {
            vp.pos.x = vp.pos.x + dx / vp.zoom;
            vp.pos.y = vp.pos.y + dy / vp.zoom;
          });
          setViewPort(newViewPort);
          e.stopPropagation();
          e.preventDefault();
        }
      },
      [onZoom, setViewPort, viewPort]
    );

    useEffect(() => {
      const { current } = boardRef;
      if (current) {
        current.addEventListener("wheel", onMaybeZoomOrPan);

        return () => {
          current.removeEventListener("wheel", onMaybeZoomOrPan);
        };
      }
    }, [onMaybeZoomOrPan]);

    const backgroundStyle: any = {
      backgroundPositionX: roundNumber(-viewPort.pos.x * viewPort.zoom),
      backgroundPositionY: roundNumber(-viewPort.pos.y * viewPort.zoom),
      backgroundSize: roundNumber(25 * viewPort.zoom) + "px",
    };

    // unoptimized code to get connected inputs
    const instancesConnectToPinsRef = React.useRef(
      new Map<string, Record<string, PartInstance[]>>()
    );

    // prune orphan connections
    React.useEffect(() => {
      const validInputs = instances.reduce((acc, ins) => {
        const part = getPartDef(ins, repo);
        if (part) {
          acc.set(ins.id, keys(part.inputs));
        }
        return acc;
      }, new Map<string, string[]>());

      const validOutputs = instances.reduce((acc, ins) => {
        const part = getPartDef(ins, repo);
        if (part) {
          acc.set(ins.id, keys(part.outputs));
        }
        return acc;
      }, new Map<string, string[]>());

      /* the parts output are targets for connections therefore they are fed into the "validInputs" map */
      validInputs.set(THIS_INS_ID, keys(part.outputs));
      /* the parts inputs are targets for connections therefore they are fed into the "validOutputs" map */
      validOutputs.set(THIS_INS_ID, keys(part.inputs));

      const orphanConnections = connections.filter((conn) => {
        if (
          conn.to.pinId === TRIGGER_PIN_ID ||
          conn.from.pinId === ERROR_PIN_ID
        ) {
          return false;
        }

        const inputsExist =
          validInputs.get(conn.to.insId) &&
          validInputs.get(conn.to.insId).includes(conn.to.pinId);
        const outputsExist =
          validOutputs.get(conn.from.insId) &&
          validOutputs.get(conn.from.insId).includes(conn.from.pinId);
        return !(inputsExist && outputsExist);
      });

      if (orphanConnections.length > 0) {
        toastMsg(
          `${orphanConnections.length} orphan connections removed`,
          "warning"
        );
        console.log(
          `${orphanConnections.length} orphan connections removed`,
          orphanConnections
        );

        const newPart = produce(part, (draft) => {
          draft.connections = part.connections.filter(
            (conn) => !orphanConnections.includes(conn)
          );
        });
        onChange(newPart, functionalChange("prune orphan connections"));
      }
    }, [instances, onChange, connections, resolvedFlow, part, repo]);

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
      async (match: QuickMenuMatch) => {
        if (!quickAddMenuVisible) {
          throw new Error(
            "impossible state - quick add menu invoked but not available"
          );
        }

        const { ins, pos, pinId } = quickAddMenuVisible;

        switch (match.type) {
          case "part": {
            const newPartIns = createNewPartInstance(
              match.part.id,
              100,
              lastMousePos.current,
              repo
            );

            if (newPartIns) {
              const newValue = produce(part, (draft) => {
                draft.instances.push(newPartIns);
                draft.connections.push({
                  from: { insId: ins ? ins.id : THIS_INS_ID, pinId },
                  to: { insId: newPartIns.id, pinId: TRIGGER_PIN_ID },
                });
              });

              onChange(newValue, functionalChange("add-item-quick-menu"));
              onCloseQuickAdd();
            }
            break;
          }
          case "import": {
            await onImportPart(match.importablePart, {
              pos: lastMousePos.current,
              connectTo: { insId: ins.id, outputId: pinId },
            });
            onCloseQuickAdd();
            break;
          }
          case "value": {
            if (!ins) {
              toastMsg("Cannot add value to main input");
              return;
            }
            setInlineCodeTarget({ type: "new-output", insId: ins.id, pinId });
          }
        }
      },
      [quickAddMenuVisible, repo, part, onChange, onCloseQuickAdd, onImportPart]
    );

    const copyPartToClipboard = React.useCallback(async () => {
      const str = JSON.stringify(part);
      await navigator.clipboard.writeText(str);
      AppToaster.show({ message: "Copied!" });
    }, [part]);

    const getContextMenu = React.useCallback(
      (pos: Pos) => {
        const maybeDisabledLabel = partIoEditable
          ? ""
          : " (cannot edit main part, only grouped)";

        return (
          <Menu>
            <MenuItem
              onMouseDown={(e) => e.stopPropagation()}
              text={"New Value"}
              onClick={preventDefaultAnd(() =>
                setInlineCodeTarget({
                  type: "new-floating",
                  pos: lastMousePos.current,
                })
              )}
            />
            <MenuItem
              text={`New input ${maybeDisabledLabel}`}
              onMouseDown={(e) => e.stopPropagation()}
              onClick={preventDefaultAnd(() => onAddIoPin("input"))}
              disabled={!partIoEditable}
            />
            <MenuItem
              onMouseDown={(e) => e.stopPropagation()}
              text={`New output ${maybeDisabledLabel}`}
              onClick={preventDefaultAnd(() => onAddIoPin("output"))}
              disabled={!partIoEditable}
            />
            <MenuItem
              onMouseDown={(e) => e.stopPropagation()}
              text={"Copy part to clipboard"}
              onClick={preventDefaultAnd(copyPartToClipboard)}
            />
            <MenuItem
              onMouseDown={(e) => e.stopPropagation()}
              text={`Edit Completion Outputs (${
                part.completionOutputs?.join(",") || "n/a"
              })`}
              onClick={preventDefaultAnd(() => editCompletionOutputs())}
            />

            <MenuItem
              onMouseDown={(e) => e.stopPropagation()}
              text={`Edit Reactive inputs (${
                part.reactiveInputs?.join(",") || "n/a"
              })`}
              onClick={preventDefaultAnd(() => editReactiveInputs())}
            />
            <MenuItem
              onMouseDown={(e) => e.stopPropagation()}
              text={`Edit description`}
              onClick={preventDefaultAnd(() => editPartDescription())}
            />
            <MenuDivider />
            <MenuItem text="Default Style">
              <PartStyleMenu
                style={part.defaultStyle}
                onChange={onChangeDefaultStyle}
                promptFn={_prompt}
              />
            </MenuItem>
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
        if (!isBoardInFocus.current) {
          return;
        }
        const pos = domToViewPort(
          { x: e.clientX, y: e.clientY },
          viewPort,
          parentViewport
        );
        const menu = getContextMenu(pos);
        ContextMenu.show(menu, { left: e.clientX, top: e.clientY });
      },
      [getContextMenu, parentViewport, viewPort]
    );

    useHotkeys("shift+c", fitToScreen, isBoardInFocus);

    useHotkeys("cmd+c", onCopyInner, isBoardInFocus);
    useHotkeys("cmd+v", onPaste, isBoardInFocus);
    useHotkeys("esc", clearSelections, isBoardInFocus);
    useHotkeys("backspace", deleteSelection, isBoardInFocus);
    useHotkeys("shift+g", onGroupSelectedInternal, isBoardInFocus);
    useHotkeys("shift+d", duplicate, isBoardInFocus);
    useHotkeys("cmd+a", selectAll, isBoardInFocus);
    useHotkeys("s", selectClosest, isBoardInFocus);

    const onChangeInspected: GroupedPartEditorProps["onChangePart"] =
      React.useCallback(
        (changedInlinePart, type) => {
          if (!openInlineInstance) {
            throw new Error("impossible state");
          }
          const newPart = produce(part, (draft) => {
            const ins = draft.instances.find(
              (i) => i.id === openInlineInstance.insId
            );
            if (!ins || !isInlinePartInstance(ins)) {
              throw new Error("impossible state");
            }
            ins.part = changedInlinePart;
          });

          onChange(newPart, functionalChange("Inner change: " + type.message));
          setOpenInlineInstance((obj) => ({ ...obj, part: changedInlinePart }));
        },
        [onChange, openInlineInstance, part]
      );

    const [inspectedBoardData, setInspectedBoardData] =
      useState<GroupEditorBoardData>({
        selected: [],
        viewPort: defaultViewPort,
        lastMousePos: { x: 0, y: 0 },
      });

    const onChangeInspectedBoardData = React.useCallback((partial) => {
      return setInspectedBoardData((data) => ({ ...data, ...partial }));
    }, []);

    const maybeGetInlineProps = (ins: PartInstance): GroupedPartEditorProps => {
      if (openInlineInstance && openInlineInstance.insId === ins.id) {
        return {
          insId: `${thisInsId}.${openInlineInstance.insId}`,
          boardData: inspectedBoardData,
          onChangeBoardData: onChangeInspectedBoardData,
          resolvedFlow: resolvedFlow,
          onCopy: onCopy,
          clipboardData: props.clipboardData,
          onInspectPin: props.onInspectPin,
          onGoToPartDef: props.onGoToPartDef,
          partIoEditable: props.partIoEditable,
          onRequestHistory: onRequestHistory,
          part: openInlineInstance.part,
          onChangePart: onChangeInspected,
          onShowOmnibar: onShowOmnibar,
          parentViewport: defaultViewPort,
          // parentViewport: viewPort, // this was needed when I rendered it completely inline
          parentBoardPos: boardPos,
          onExtractInlinePart: props.onExtractInlinePart,
          onImportPart: props.onImportPart,
        };
      } else {
        return;
      }
    };

    const maybeGetFutureConnection = () => {
      if (
        from &&
        ((closestPin?.type === "input" && closestPin?.ins.id !== part.id) ||
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
        ((closestPin?.type === "output" && closestPin?.ins.id !== part.id) ||
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

    const maybeRenderFutureConnection =
      (): ConnectionViewProps["futureConnection"] => {
        const maybeFutureConnection = maybeGetFutureConnection();
        if (maybeFutureConnection) {
          const { from, to } = maybeFutureConnection;
          return {
            connection: { from, to },
            type: connections.some((conn) =>
              connectionDataEquals(conn, maybeFutureConnection)
            )
              ? "future-remove"
              : "future-add",
          };
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

    const onChangeInstanceStyle = React.useCallback(
      (instance: PartInstance, style: PartStyle) => {
        const newPart = produce(part, (draft) => {
          draft.instances = draft.instances.map((ins) => {
            return ins.id === instance.id ? { ...ins, style } : ins;
          });
        });
        onChange(newPart, functionalChange("change instance style"));
      },
      [onChange, part]
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

    const onChangeInstanceDisplayName = React.useCallback(
      (ins: PartInstance, name: string) => {
        const newPart = produce(part, (draft) => {
          draft.instances = draft.instances.map((i) => {
            return i.id === ins.id ? { ...i, displayName: name } : i;
          });
        });
        onChange(newPart, functionalChange("change instance display name"));
      },
      [part, onChange]
    );
    // The component instance will be extended
    // with whatever you return from the callback passed
    // as the second argument
    React.useImperativeHandle(thisRef, () => ({
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
        onChange(
          newPart,
          functionalChange("change instance config - " + comment)
        );
      },
      [onChange, part]
    );

    // use this to debug positioning/layout related stuff
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [layoutDebuggers, setLayoutDebuggers] = React.useState<
      Array<Omit<LayoutDebuggerProps, "viewPort">>
    >([]);

    // const maybeRenderInstancePanel = () => {
    //   if (selected.length === 1) {
    //     const instance = part.instances.find((ins) => ins.id === selected[0]);
    //     if (!instance) {
    //       throw new Error("Selected instance not found");
    //     }
    //     const insPart = getPartDef(instance, repo);
    //     if (!insPart) {
    //       throw new Error("Selected instance part not found");
    //     }

    //     const connections = part.connections.filter(
    //       (c) => c.from.insId === instance.id || c.to.insId === instance.id
    //     );

    //     return (
    //       <InstancePanel
    //         instance={instance}
    //         part={insPart}
    //         connections={connections}
    //         onChangeInstanceConfig={onChangeInstanceConfig}
    //       />
    //     );
    //   }

    //   return null;
    // };

    const onSaveInlineValuePart = React.useCallback(
      (type: InlineValuePartType, code: string) => {
        const customView = code.trim().substr(0, 100);
        const partId = `Inline-value-${customView
          .substr(0, 15)
          .replace(/["'`]/g, "")}`;

        const newPart = createInlineValuePart({
          code,
          customView,
          partId,
          type,
        });

        switch (inlineCodeTarget.type) {
          case "existing": {
            const [existingInlinePart] = part.instances
              .filter((ins) => ins.id === inlineCodeTarget.insId)
              .filter((ins) => isInlinePartInstance(ins))
              .map((ins: InlinePartInstance) => ins.part);

            if (!existingInlinePart) {
              throw new Error(`Unable to find inline part to save to`);
            }

            const oldInputs = keys(existingInlinePart.inputs);
            const newInputs = keys(newPart.inputs);

            const removedInputs = new Set(_.difference(oldInputs, newInputs));

            const newVal = produce(part, (draft) => {
              draft.instances = draft.instances.map((i) => {
                return i.id === inlineCodeTarget.insId
                  ? inlinePartInstance(i.id, newPart, i.inputConfig, i.pos)
                  : i;
              });
              draft.connections = draft.connections.filter((conn) => {
                const wasRemoved =
                  conn.to.insId === inlineCodeTarget.insId &&
                  removedInputs.has(conn.to.pinId);
                return !wasRemoved;
              });
            });

            onChange(newVal, functionalChange("change inline value"));

            setInlineCodeTarget(undefined);
            break;
          }
          case "static-input": {
            let val: any;
            try {
              const normalizeString = code
                .replace(/^['`]/, '"')
                .replace(/['`]$/, '"');
              val = JSON.parse(normalizeString);
            } catch (e) {
              toastMsg("Input values must not be formulas or code");
              return;
            }

            const newVal = produce(part, (draft) => {
              const ins = draft.instances.find(
                (i) => i.id === inlineCodeTarget.insId
              );
              ins.inputConfig[inlineCodeTarget.pinId] =
                staticInputPinConfig(val);
            });

            onChange(newVal, functionalChange("set static input value"));

            setInlineCodeTarget(undefined);
            break;
          }
          case "new-floating": {
            const ins = inlinePartInstance(
              cuid(),
              newPart,
              {},
              inlineCodeTarget.pos
            );
            const newVal = produce(part, (draft) => {
              draft.instances.push(ins);
            });
            onChange(newVal, functionalChange("new floating value"));
            setInlineCodeTarget(undefined);
            break;
          }
          case "new-output": {
            const { insId, pinId } = inlineCodeTarget;
            const existingIns = part.instances.find((i) => i.id === insId);
            if (!existingIns) {
              throw new Error(`Impossible state`);
            }
            const newIns = inlinePartInstance(
              cuid(),
              newPart,
              {},
              vAdd(existingIns.pos, { x: -50, y: 150 })
            );
            const newVal = produce(part, (draft) => {
              draft.instances.push(newIns);
              draft.connections.push({
                from: connectionNode(insId, pinId),
                to: connectionNode(newIns.id, TRIGGER_PIN_ID),
              });
            });
            onChange(newVal, functionalChange("new value connected to output"));
            setInlineCodeTarget(undefined);
          }
        }
      },
      [inlineCodeTarget, onChange, part]
    );

    const connectionsToRender = connections.filter((conn) => {
      // do not render on top of a future connection so it shows removal properly
      const fConn = maybeGetFutureConnection();
      if (!fConn) {
        return true;
      }
      return !connectionDataEquals(fConn, conn);
    });

    const closeInlineEditor = React.useCallback(() => {
      setOpenInlineInstance(undefined);
      setInspectedBoardData(defaultBoardData);
    }, []);

    const toggleConnectionHidden = React.useCallback(
      (connection: ConnectionData) => {
        const val = produce(part, (draft) => {
          const conn = draft.connections.find((conn) =>
            connectionDataEquals(conn, connection)
          );
          conn.hidden = !conn.hidden;
        });
        onChange(val, functionalChange("toggle connection hidden"));
      },
      [onChange, part]
    );

    const removeConnection = React.useCallback(
      (connection: ConnectionData) => {
        const val = produce(part, (draft) => {
          draft.connections = draft.connections.filter(
            (conn) => !connectionDataEquals(conn, connection)
          );
        });
        onChange(val, functionalChange("remove connection"));
      },
      [onChange, part]
    );

    try {
      return (
        <div
          className={classNames("grouped-part-editor", props.className)}
          data-id={part.id}
          onContextMenu={showContextMenu}
        >
          <main
            className="board-editor-inner"
            onMouseDown={onMouseDown}
            onMouseUp={onMouseUp}
            onMouseMove={onMouseMove}
            onMouseLeave={onMouseLeave}
            ref={boardRef as any}
            style={backgroundStyle}
          >
            <React.Fragment>
              <LayoutDebugger
                vp={viewPort}
                part={part}
                extraDebug={emptyList}
                mousePos={lastMousePos.current}
              />
            </React.Fragment>
            {/* <div className='debug-info'>
              <span className='viewport'>
                {`${viewPort.pos.x.toFixed(2)}, ${viewPort.pos.y.toFixed(2)} | ${viewPort.zoom}`}
              </span>
            </div> */}
            <ConnectionView
              repo={repo}
              parentInsId={thisInsId}
              size={vpSize}
              part={part}
              boardPos={boardPos}
              instances={instances}
              connections={connectionsToRender}
              futureConnection={maybeRenderFutureConnection()}
              onDblClick={noop}
              viewPort={viewPort}
              parentVp={parentViewport}
              selectedInstances={selected}
              toggleHidden={toggleConnectionHidden}
              removeConnection={removeConnection}
            />
            {renderPartInputs()}
            {instances.map((ins) => (
              <InstanceView
                onUngroup={onUngroup}
                onExtractInlinePart={onExtractInlinePart}
                onDetachConstValue={onDetachConstValue}
                onCopyConstValue={onCopyConstValue}
                onPasteConstValue={onPasteConstValue}
                copiedConstValue={copiedConstValue}
                connectionsPerInput={
                  instancesConnectToPinsRef.current.get(ins.id) || emptyObj
                }
                connectionsPerOutput={emptyObj}
                part={getPartDef(ins, repo)}
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
                selected={selected.indexOf(ins.id) !== -1}
                dragged={draggingId === ins.id}
                onInspectPin={_onInspectPin}
                selectedInput={
                  to && isInternalConnectionNode(to) && to.insId === ins.id
                    ? to.pinId
                    : undefined
                }
                selectedOutput={
                  from &&
                  isInternalConnectionNode(from) &&
                  from.insId === ins.id
                    ? from.pinId
                    : undefined
                }
                closestPin={
                  closestPin && closestPin.ins.id === ins.id
                    ? closestPin
                    : undefined
                }
                instance={ins}
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
                onSetDisplayName={onChangeInstanceDisplayName}
                onDeleteInstance={onDeleteInstance}
                key={ins.id}
                forceShowMinimized={from ? "input" : to ? "output" : undefined}
                isConnectedInstanceSelected={selected.some((selInsId) =>
                  connections.some(({ from, to }) => {
                    return (
                      (from.insId === ins.id && to.insId === selInsId) ||
                      (from.insId === selInsId && to.insId === ins.id)
                    );
                  })
                )}
                inlineGroupProps={maybeGetInlineProps(ins)}
                onCloseInlineEditor={closeInlineEditor}
                inlineEditorPortalDomNode={inlineEditorPortalRootRef.current}
                onChangeStyle={onChangeInstanceStyle}
                onGroupSelected={onGroupSelectedInternal}
              />
            ))}
            {maybeRenderSelectionBox()}
            {/* {maybeRenderEditGroupModal()} */}
            {renderPartOutputs()}
            {quickAddMenuVisible ? (
              <QuickAddMenu
                part={quickAddMenuVisible.part}
                pinId={quickAddMenuVisible.pinId}
                pinType={quickAddMenuVisible.pinType}
                pos={quickAddMenuVisible.pos}
                resolvedFlow={resolvedFlow}
                onRequestImportables={props.onRequestImportables}
                onAdd={onQuickAdd}
                onClose={onCloseQuickAdd}
              />
            ) : null}
            <div className="viewport-controls">
              <Button small onClick={fitToScreen}>
                Reset view
              </Button>
              <MemodSlider
                min={0.05}
                max={3}
                stepSize={0.05}
                labelStepSize={10}
                labelRenderer={sliderRenderer}
                onChange={onZoom}
                value={viewPort.zoom}
              />
            </div>
            {inlineCodeTarget ? (
              <InlineCodeModal
                env={emptyObj}
                initialValue={inlineCodeTarget.value}
                initialType={
                  inlineCodeTarget.type === "existing"
                    ? inlineCodeTarget.templateType
                    : undefined
                }
                onCancel={() => setInlineCodeTarget(undefined)}
                onSubmit={onSaveInlineValuePart}
              />
            ) : null}
            <div className="inline-editor-portal-root" />
          </main>
          {/* {maybeRenderInlinePartInstance()} */}
          {/* {maybeRenderInstancePanel()} */}
        </div>
      );
    } catch (e) {
      console.error(e);
      return <div>Error rendering board - {(e as any).toString()}</div>;
    }
  })
);

const isEventOnCurrentBoard = (
  e: KeyboardEvent | MouseEvent,
  partId: string
) => {
  const targetElem = e.target as Element;
  const closestBoard = targetElem.closest(".grouped-part-editor");

  return closestBoard && closestBoard.getAttribute("data-id") === partId;
};
