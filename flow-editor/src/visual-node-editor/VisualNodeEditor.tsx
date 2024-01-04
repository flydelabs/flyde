import * as React from "react";

import {
  isExternalConnectionNode,
  THIS_INS_ID,
  ConnectionData,
  isInternalConnectionNode,
  VisualNode,
  nodeInput,
  NodeInstance,
  nodeOutput,
  PinType,
  isStaticInputPinConfig,
  InputMode,
  isVisualNode,
  connectionDataEquals,
  ConnectionNode,
  staticInputPinConfig,
  delay,
  noop,
  keys,
  TRIGGER_PIN_ID,
  inlineNodeInstance,
  isInlineNodeInstance,
  isRefNodeInstance,
  InlineValueNodeType,
  isInlineValueNode,
  InlineNodeInstance,
  connectionNode,
  ImportedNodeDef,
  NodeStyle,
  getNodeOutputs,
  Pos,
  getNodeInputs,
  createInsId,
  externalConnectionNode,
  ResolvedDependenciesDefinitions,
  fullInsIdPath,
  isStickyInputPinConfig,
  stickyInputPinConfig,
  ROOT_INS_ID,
  isMacroNodeInstance,
  isResolvedMacroNodeInstance,
  ResolvedMacroNodeInstance,
  isMacroNodeDefinition,
} from "@flyde/core";

import { InstanceView, InstanceViewProps } from "./instance-view/InstanceView";
import {
  ConnectionView,
  ConnectionViewProps,
} from "./connection-view/ConnectionView";
import { entries, isDefined, preventDefaultAnd, Size } from "../utils";
import { useBoundingclientrect, useDidMount } from "rooks";

import {
  findClosestPin,
  getSelectionBoxRect,
  emptyObj,
  createNewNodeInstance,
  ViewPort,
  domToViewPort,
  roundNumber,
  fitViewPortToNode,
  getInstancesInRect,
  handleInstanceDrag,
  handleIoPinRename,
  handleChangeNodeInputType,
  calcSelectionBoxArea,
  centerBoardPosOnTarget,
  emptyList,
  animateViewPort,
  logicalPosToRenderedPos,
  getMiddleOfViewPort,
  getInstancePinConfig,
  changePinConfig,
  createNewMacroNodeInstance,
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
import { NodeIoView, NodeIoViewProps } from "./node-io-view";

import { vAdd, vec, vSub, vZero } from "../physics";
import {
  QuickAddMenu,
  QuickAddMenuData,
  QuickMenuMatch,
} from "./quick-add-menu";
import { queueInputPinConfig } from "@flyde/core";
import { orderVisualNode } from "./order-layout/cmd";
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
import { createInlineValueNode } from "../flow-editor/inline-code-modal/inline-code-to-node";
import _ from "lodash";
import { groupSelected } from "../group-selected";
import { useConfirm, usePorts, usePrompt } from "../flow-editor/ports";
import classNames from "classnames";
import { pasteInstancesCommand } from "./commands/paste-instances";

import { handleConnectionCloseEditorCommand } from "./commands/close-connection";
import { handleDetachConstEditorCommand } from "./commands/detach-const";
import { handleDuplicateSelectedEditorCommand } from "./commands/duplicate-instances";
import { NodeStyleMenu } from "./instance-view/NodeStyleMenu";
import { useDependenciesContext } from "../flow-editor/FlowEditor";
import { Action, ActionsMenu, ActionType } from "./ActionsMenu/ActionsMenu";
import { MainInstanceEventsIndicator } from "./MainInstanceEventsIndicator";
import { HelpBubble } from "./HelpBubble";
import { safelyGetNodeDef } from "../flow-editor/getNodeDef";
import { useDarkMode } from "../flow-editor/DarkModeContext";
import {
  MacroInstanceEditor,
  MacroInstanceEditorProps,
} from "./MacroInstanceEditor";
import { on } from "events";

const MemodSlider = React.memo(Slider);

const sliderRenderer = () => null;

export const NODE_HEIGHT = 28;
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
  ins: NodeInstance;
  pin: string;
  type: "input" | "output";
}

export type ClipboardData = {
  instances: NodeInstance[];
  connections: ConnectionData[];
};

export type GroupEditorBoardData = {
  viewPort: ViewPort;
  selected: string[];
  lastMousePos: Pos;
  from?: ConnectionNode;
  to?: ConnectionNode;
};

export type VisualNodeEditorProps = {
  node: VisualNode;
  currentInsId: string;
  ancestorsInsIds?: string;

  clipboardData: ClipboardData;
  resolvedDependencies: ResolvedDependenciesDefinitions;

  nodeIoEditable: boolean;
  thumbnailMode?: true;

  boardData: GroupEditorBoardData;

  onChangeBoardData: (data: Partial<GroupEditorBoardData>) => void;

  onChangeNode: (val: VisualNode, type: FlydeFlowChangeType) => void;

  onCopy: (data: ClipboardData) => void;
  onInspectPin: (insId: string, pin?: { id: string; type: PinType }) => void;

  onGoToNodeDef: (node: ImportedNodeDef) => void;
  onExtractInlineNode: (instance: InlineNodeInstance) => Promise<void>;

  onShowOmnibar: (e: any) => void;

  className?: string;

  parentViewport?: ViewPort;
  parentBoardPos?: Pos;

  queuedInputsData?: Record<string, Record<string, number>>;
  instancesWithErrors?: Set<string>;

  initialPadding?: [number, number];
  disableScrolling?: boolean;
};

type InlineValueTargetExisting = {
  insId: string;
  value: string;
  templateType: InlineValueNodeType;
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

export interface VisualNodeEditorHandle {
  centerInstance(insId: string): void;
  centerViewPort(): void;
  getViewPort(): ViewPort;
  clearSelection(): void;
  requestNewInlineValue(): void;
}

export const VisualNodeEditor: React.FC<VisualNodeEditorProps & { ref?: any }> =
  React.memo(
    React.forwardRef((props, thisRef) => {
      const {
        onChangeNode: onChange,
        nodeIoEditable,
        onCopy,
        onGoToNodeDef: onEditNode,
        onInspectPin,
        boardData,
        onChangeBoardData,
        currentInsId,
        ancestorsInsIds,
        node,
        onShowOmnibar,
        resolvedDependencies,
        queuedInputsData: queueInputsData,
        initialPadding,
        disableScrolling,
      } = props;

      const { onImportNode } = useDependenciesContext();

      const darkMode = useDarkMode();

      const { reportEvent } = usePorts();

      const parentViewport = props.parentViewport || defaultViewPort;

      const [currResolvedDeps, setResolvedDeps] = useState({
        ...resolvedDependencies,
        [node.id]: node,
      });

      useEffect(() => {
        setResolvedDeps({
          ...resolvedDependencies,
          [node.id]: node,
        });
      }, [resolvedDependencies, node]);

      const { selected, from, to } = boardData;
      const {
        instances,
        connections,
        inputsPosition,
        outputsPosition,
        inputs,
        outputs,
      } = node;

      // hooks area
      const [draggingId, setDraggingId] = useState<string>();
      const [selectionBox, setSelectionBox] = useState<{
        from: Pos;
        to: Pos;
      }>();

      const isRootInstance = ancestorsInsIds === undefined;

      const [lastBoardClickTime, setLastBoardClickTime] = useState<number>(0);

      const [lastSelectedId, setLastSelectedId] = useState<string>(); // to avoid it disappearing when doubling clicking to edit

      const [didCenterInitially, setDidCenterInitially] = useState(false);

      const [quickAddMenuVisible, setQuickAddMenuVisible] =
        useState<QuickAddMenuData>();

      const [copiedConstValue, setCopiedConstValue] = useState<any>();

      const [inlineCodeTarget, setInlineCodeTarget] =
        useState<InlineValueTarget>();

      const [openInlineInstance, setOpenInlineInstance] = useState<{
        node: VisualNode;
        insId: string;
      }>();

      const [editedMacroInstance, setEditedMacroInstance] = useState<{
        ins: ResolvedMacroNodeInstance;
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

      const [draggedConnection, setDraggedConnection] = useState<
        | null
        | { from: ConnectionNode; to: undefined }
        | { to: ConnectionNode; from: undefined }
      >(null);

      const setViewPort = React.useCallback(
        (viewPort) => {
          onChangeBoardData({ viewPort });
        },
        [onChangeBoardData]
      );

      const _onInspectPin = React.useCallback<
        VisualNodeEditorProps["onInspectPin"]
      >(
        (insId, pin) => {
          return onInspectPin(insId, pin);
        },
        [onInspectPin]
      );

      const onConnectionClose = React.useCallback(
        (from: ConnectionNode, to: ConnectionNode, source: string) => {
          const newNode = handleConnectionCloseEditorCommand(node, {
            from,
            to,
          });

          const maybeIns = isInternalConnectionNode(to)
            ? instances.find((i) => i.id === to.insId)
            : null;
          const inputConfig = maybeIns ? maybeIns.inputConfig : {};
          const pinConfig = inputConfig[to.pinId];
          const isTargetStaticValue = isStaticInputPinConfig(pinConfig);

          const maybeDetachedNode = isTargetStaticValue
            ? handleDetachConstEditorCommand(newNode, to.insId, to.pinId)
            : newNode;

          onChange(maybeDetachedNode, functionalChange("close-connection"));
          onChangeBoardData({ from: undefined, to: undefined });
          reportEvent("createConnection", { source });
        },
        [instances, onChange, onChangeBoardData, node, reportEvent]
      );

      const onGroupSelectedInternal = React.useCallback(async () => {
        const name = await _prompt("New visual node name?");
        if (!name) return;
        const { currentNode } = await groupSelected(
          boardData.selected,
          node,
          name,
          "inline",
          _prompt
        );
        onChange(currentNode, functionalChange("group node"));

        toastMsg("Node grouped");

        reportEvent("groupSelected", { count: boardData.selected.length });
      }, [_prompt, boardData.selected, onChange, node, reportEvent]);

      useEffect(() => {
        if (lastSelectedId) {
          const t = setTimeout(() => {
            setLastSelectedId(undefined);
          }, 350);

          return () => clearTimeout(t);
        }
      }, [lastSelectedId]);

      const [closestPin, setClosestPin] = useState<{
        ins: NodeInstance;
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
        const vp = fitViewPortToNode(node, currResolvedDeps, vpSize);

        animateViewPort(viewPort, vp, 500, (vp) => {
          setViewPort(vp);
        });
      };

      const onNodeIoPinClick = React.useCallback(
        (pinId: string, type: PinType) => {
          const { to: currTo, from: currFrom } = boardData;

          const relevantCurrPin = type === "input" ? currFrom : currTo;
          const relevantTargetPin = type === "input" ? currTo : currFrom;

          const newPin = { pinId, insId: THIS_INS_ID };
          const targetObj =
            type === "input" ? { from: newPin } : { to: newPin };

          if (relevantCurrPin && relevantCurrPin.pinId === pinId) {
            // selecting the same pin so deselect both
            onChangeBoardData({ from: undefined, to: undefined });
          } else if (!relevantTargetPin) {
            // nothing was selected, selecting a new pin
            onChangeBoardData(targetObj);
          } else {
            //close the connection if we have a target match
            if (type === "input" && currTo) {
              onConnectionClose(newPin, currTo, "nodeIoClick");
            } else if (currFrom) {
              onConnectionClose(currFrom, newPin, "nodeIoClick");
            }
          }
        },
        [boardData, onChangeBoardData, onConnectionClose]
      );

      const onNodeIoSetDescription = React.useCallback(
        (type: PinType, pinId: string, description: string) => {
          const newNode = produce(node, (draft) => {
            if (type === "input") {
              draft.inputs[pinId].description = description;
            } else {
              draft.outputs[pinId].description = description;
            }
          });
          onChange(newNode, functionalChange("Node io description"));
        },
        [onChange, node]
      );

      const onPinClick = React.useCallback(
        (ins: NodeInstance, pinId: string, type: PinType) => {
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
              (isInternalConnectionNode(currTo)
                ? currTo.insId === ins.id
                : true)
            ) {
              onChangeBoardData({ to: undefined });
            } else if (from) {
              onConnectionClose(from, to, "pinClick");
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
              onConnectionClose(from, to, "pinClick");
            } else {
              onChangeBoardData({ from, selected: [] });
            }
          }
        },
        [boardData, from, onChangeBoardData, onConnectionClose, to]
      );

      useEffect(() => {
        if (!didCenterInitially && vpSize.width) {
          const vp = fitViewPortToNode(
            node,
            currResolvedDeps,
            vpSize,
            initialPadding
          );
          setViewPort(vp);
          // hackidy hack
          const timer = setTimeout(() => {
            const vp = fitViewPortToNode(
              node,
              currResolvedDeps,
              vpSize,
              initialPadding
            );
            if (!props.thumbnailMode) {
              // hack to make project view work nicely
              setViewPort(vp);
            }
            setDidCenterInitially(true);
          }, 100);
          return () => clearTimeout(timer);
        }
      }, [
        node,
        initialPadding,
        vpSize,
        props.thumbnailMode,
        didCenterInitially,
        currResolvedDeps,
        setViewPort,
      ]);

      const onCopyInner = React.useCallback(() => {
        const { selected } = boardData;
        const instances = node.instances
          .filter((ins) => selected.includes(ins.id))
          .map((ins) => ({ ...ins, id: ins.id + "-copy" }));
        const connections = node.connections.filter(({ from, to }) => {
          return selected.includes(from.insId) && selected.includes(to.insId);
        });
        onCopy({ instances, connections });
      }, [boardData, onCopy, node]);

      const onPaste = React.useCallback(() => {
        const { newNode, newInstances } = pasteInstancesCommand(
          node,
          lastMousePos.current,
          props.clipboardData
        );
        onChange(newNode, functionalChange("paste instances"));

        onChangeBoardData({ selected: newInstances.map((ins) => ins.id) });
      }, [onChange, onChangeBoardData, node, props.clipboardData]);

      const selectClosest = React.useCallback(() => {
        const rootId = node.id;

        if (!closestPin) {
          console.warn("tried selecting closest with no pin nearby");
          return;
        }

        if (closestPin.type === "input") {
          if (closestPin.ins.id === rootId) {
            onNodeIoPinClick(closestPin.pin, "input");
          } else {
            onPinClick(closestPin.ins, closestPin.pin, "input");
          }
        } else {
          if (closestPin.ins.id === rootId) {
            onNodeIoPinClick(closestPin.pin, "output");
          } else {
            onPinClick(closestPin.ins, closestPin.pin, "output");
          }
        }
      }, [node.id, closestPin, onNodeIoPinClick, onPinClick]);

      const onZoom = React.useCallback(
        (_newZoom: number, source?: "hotkey" | "mouse") => {
          const newZoom = Math.min(Math.max(_newZoom, 0.1), 3);
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
        { text: "Zoom in board", group: "Viewport Controls" },
        [viewPort, onZoom],
        isBoardInFocus
      );

      useHotkeys(
        "cmd+-",
        (e) => {
          onZoom(viewPort.zoom - 0.1, "hotkey");
          e.preventDefault();
        },
        { text: "Zoom out board", group: "Viewport Controls" },
        [onZoom, viewPort.zoom],
        isBoardInFocus
      );

      useHotkeys(
        "cmd+o",
        (e) => {
          e.preventDefault();
          toastMsg("Ordering");
          const steps: any[] = [];
          orderVisualNode(node, currResolvedDeps, 200, (step, idx) => {
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
        { text: "Auto-layout (experimental)", group: "Misc." },
        [onChange, node, resolvedDependencies],
        isBoardInFocus
      );

      useHotkeys(
        "cmd+0",
        (e) => {
          onZoom(1);
          e.preventDefault();
        },
        { text: "Reset zoom", group: "Viewport Controls" },
        [viewPort, onZoom],
        isBoardInFocus
      );

      const clearSelections = () => {
        onChangeBoardData({
          from: undefined,
          to: undefined,
          selected: [],
        });
      };

      const onStartDraggingInstance = React.useCallback(
        (ins: NodeInstance, event: React.MouseEvent) => {
          // event.preventDefault();
          // event.stopPropagation();
          setDraggingId(ins.id);
          onChange({ ...node }, metaChange("drag-start"));
        },
        [onChange, node]
      );

      const onInstanceDragMove = React.useCallback(
        (ins: NodeInstance, event: any, pos: Pos) => {
          const { newValue, newSelected } = handleInstanceDrag(
            node,
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
        [draggingId, onChange, onChangeBoardData, selected, node]
      );

      const onInstanceDragEnd = React.useCallback((_, event) => {
        event.preventDefault();
        event.stopPropagation();
        setDraggingId(undefined);
      }, []);

      const onStartDraggingNodeIo = React.useCallback(
        (_: string, event: any) => {
          event.preventDefault();
          event.stopPropagation();
          setDraggingId(THIS_INS_ID);
        },
        []
      );

      const onDragMoveNodeIo = React.useCallback(
        async (
          type: "input" | "output",
          pin: string,
          event: any,
          data: any
        ) => {
          event.preventDefault();
          event.stopPropagation();
          const { x, y } = data;
          // setDraggingId(undefined);

          const newValue = produce(node, (draft) => {
            if (type === "input") {
              draft.inputsPosition[pin] = { x, y };
            } else {
              draft.outputsPosition[pin] = { x, y };
            }
          });

          props.onChangeNode(newValue, metaChange("node-io-drag-move"));
        },
        [props, node]
      );

      const onDragEndNodeIo = React.useCallback(
        async (
          type: "input" | "output",
          pin: string,
          event: any,
          data: any
        ) => {
          event.preventDefault();
          event.stopPropagation();
          // const { x, y } = data;
          setDraggingId(undefined);
        },
        []
      );

      const onSelectInstance = React.useCallback(
        ({ id }: NodeInstance, ev: React.MouseEvent) => {
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
        const allIds = node.instances.map((i) => i.id);
        onChangeBoardData({ selected: allIds, from: undefined, to: undefined });
      }, [onChangeBoardData, node.instances]);

      const onDeleteInstances = React.useCallback(
        (ids: string[]) => {
          const newConnections = connections.filter(({ from, to }) => {
            return (
              ids.indexOf(from.insId) === -1 && ids.indexOf(to.insId) === -1
            );
          });

          const newValue = produce(node, (draft) => {
            draft.connections = newConnections;
            draft.instances = draft.instances.filter(
              (_ins) => !ids.includes(_ins.id)
            );
          });

          onChangeBoardData({ selected: [] });
          onChange(newValue, functionalChange("delete-ins"));
        },
        [connections, onChange, onChangeBoardData, node]
      );

      const onDeleteInstance = React.useCallback(
        (ins: NodeInstance) => {
          onDeleteInstances([ins.id]);
        },
        [onDeleteInstances]
      );

      const onRemoveIoPin = React.useCallback(
        (type: PinType, pinId: string) => {
          const newValue = produce(node, (draft) => {
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
                  !(
                    isExternalConnectionNode(conn.to) && conn.to.pinId === pinId
                  )
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

          if (from && from.insId === THIS_INS_ID && from.pinId === pinId) {
            onChangeBoardData({ from: undefined });
          } else if (to && to.insId === THIS_INS_ID && to.pinId === pinId) {
            onChangeBoardData({ to: undefined });
          }

          onChange(newValue, functionalChange("remove io pin"));
        },
        [node, from, to, onChange, onChangeBoardData]
      );

      const deleteSelection = React.useCallback(async () => {
        const { selected, from, to } = boardData;
        if (selected.length === 0) {
          if (from && isExternalConnectionNode(from)) {
            if (
              await _confirm(
                `Are you sure you want to remove main input ${from.pinId}?`
              )
            ) {
              onRemoveIoPin("input", from.pinId);
            }
          } else if (to && isExternalConnectionNode(to)) {
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
        (ins: NodeInstance, pinId: string, forceValue?: boolean) => {
          const currConfig = getInstancePinConfig(node, ins.id, pinId);
          const newConfig = isStickyInputPinConfig(currConfig)
            ? queueInputPinConfig()
            : stickyInputPinConfig();
          onChange(
            changePinConfig(node, ins.id, pinId, newConfig),
            functionalChange("toggle-sticky")
          );
          reportEvent("togglePinSticky", {
            isSticky: isStickyInputPinConfig(newConfig),
          });
        },

        [onChange, node, reportEvent]
      );

      const duplicate = React.useCallback(() => {
        const { newNode, newInstances } = handleDuplicateSelectedEditorCommand(
          node,
          selected
        );

        onChange(newNode, functionalChange("duplicated instances"));
        onChangeBoardData({ selected: newInstances.map((ins) => ins.id) });
        // onChange(duplicateSelected(value), functionalChange("duplicate"));
      }, [onChange, onChangeBoardData, node, selected]);

      const onMouseDown: React.MouseEventHandler = React.useCallback(
        (e) => {
          const target = e.nativeEvent.target as HTMLElement;

          if (e.button !== 0) {
            // right click
            return;
          }
          if (!isEventOnCurrentBoard(e.nativeEvent, node.id)) {
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
          node.id,
          viewPort,
          lastBoardClickTime,
          boardPos,
          parentViewport,
          onShowOmnibar,
        ]
      );

      const onMouseUp: React.MouseEventHandler = React.useCallback(
        (e) => {
          setDraggedConnection(null);
          if (!isEventOnCurrentBoard(e.nativeEvent, node.id)) {
            return;
          }
          if (selectionBox) {
            if (calcSelectionBoxArea(selectionBox) > 50) {
              const toSelect = getInstancesInRect(
                selectionBox,
                currResolvedDeps,
                viewPort,
                instancesConnectToPinsRef.current,
                node.instances,
                boardPos,
                parentViewport
              );
              const newSelected = e.shiftKey
                ? [...selected, ...toSelect]
                : toSelect;
              onChangeBoardData({ selected: newSelected });
            }

            setSelectionBox(undefined);
          }
        },
        [
          node.id,
          node.instances,
          selectionBox,
          currResolvedDeps,
          viewPort,
          boardPos,
          parentViewport,
          selected,
          onChangeBoardData,
        ]
      );

      const onMouseMove: React.MouseEventHandler = React.useCallback(
        (e) => {
          if (!isEventOnCurrentBoard(e.nativeEvent, node.id)) {
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

          if (selectionBox) {
            setSelectionBox({ ...selectionBox, to: posInBoard });
          }

          const closest = findClosestPin(
            node,
            currResolvedDeps,
            normalizedPos,
            boardPos,
            currentInsId,
            ancestorsInsIds,
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
          node,
          boardPos,
          viewPort,
          parentViewport,
          selectionBox,
          currResolvedDeps,
          currentInsId,
          ancestorsInsIds,
          closestPin,
          onChangeBoardData,
        ]
      );

      const onMouseLeave: React.MouseEventHandler = React.useCallback((e) => {
        if ((e.relatedTarget as any)?.className === "bp5-menu") {
          // hack to ignore context menu opening as mouse leave
          return;
        }
        setClosestPin(undefined);
        isBoardInFocus.current = false;
      }, []);

      const onDblClickInstance = React.useCallback(
        (ins: NodeInstance, shift: boolean) => {
          if (shift) {
            if (isMacroNodeInstance(ins)) {
              toastMsg("Cannot edit macro node instance");
              return;
            }
            const node = isInlineNodeInstance(ins)
              ? ins.node
              : safelyGetNodeDef(ins.nodeId, currResolvedDeps);
            if (!node) {
              throw new Error(`Impossible state inspecting inexisting node`);
            }
            if (!isVisualNode(node)) {
              toastMsg("Cannot inspect a non visual node", "warning");
              //`Impossible state inspecting visual node`);
              return;
            }

            setOpenInlineInstance({ insId: `${currentInsId}.${ins.id}`, node });
          } else {
            if (isRefNodeInstance(ins)) {
              const node = safelyGetNodeDef(ins, currResolvedDeps);

              onEditNode(node as ImportedNodeDef);
            } else if (isInlineNodeInstance(ins)) {
              const node = ins.node;
              if (!isInlineValueNode(node)) {
                if (isVisualNode(node)) {
                  setOpenInlineInstance({ insId: ins.id, node });
                } else {
                  toastMsg("Editing this type of node is not supported");
                }
                return;
              }
              const value = atob(node.dataBuilderSource);
              setInlineCodeTarget({
                insId: ins.id,
                templateType: node.templateType,
                value,
                type: "existing",
              });
              toastMsg("Editing inline visual node not supported yet");
            } else if (isResolvedMacroNodeInstance(ins)) {
              setEditedMacroInstance({ ins });
            } else {
              toastMsg("Editing this type of node is not supported");
            }
          }
        },
        [onEditNode, currResolvedDeps, currentInsId]
      );

      const onUnGroup = React.useCallback(
        (groupNodeIns: NodeInstance) => {
          if (isInlineNodeInstance(groupNodeIns)) {
            const visualNode = groupNodeIns.node;
            if (!isVisualNode(visualNode)) {
              toastMsg("Not supported", "warning");
              return;
            }

            const newNode = produce(node, (draft) => {
              draft.instances = draft.instances.filter(
                (ins) => ins.id !== groupNodeIns.id
              );

              draft.connections = draft.connections.filter(
                ({ from, to }) =>
                  from.insId !== groupNodeIns.id && to.insId !== groupNodeIns.id
              );

              draft.instances.push(...visualNode.instances);
              draft.connections.push(
                ...visualNode.connections.filter((conn) => {
                  return (
                    isInternalConnectionNode(conn.from) &&
                    isInternalConnectionNode(conn.to)
                  );
                })
              );
            });

            onChange(newNode, { type: "functional", message: "ungroup" });
            // todo - combine the above with below to an atomic action
            onChangeBoardData({ selected: [] });
          } else {
            toastMsg("Cannot ungroup an imported group");
          }
        },
        [node, onChange, onChangeBoardData]
      );

      const onExtractInlineNode = React.useCallback(
        async (inlineInstance: InlineNodeInstance) => {},
        []
      );

      const onDetachConstValue = React.useCallback(
        (ins: NodeInstance, pinId: string) => {
          const newNode = handleDetachConstEditorCommand(node, ins.id, pinId);
          onChange(newNode, functionalChange("detach-const"));
        },
        [onChange, node]
      );

      const onCopyConstValue = React.useCallback(
        (ins: NodeInstance, pinId: string) => {
          const config = ins.inputConfig[pinId] || queueInputPinConfig();
          if (isStaticInputPinConfig(config)) {
            setCopiedConstValue(config.value);
            AppToaster.show({ message: "Value copied" });
          }
        },
        []
      );

      const onPasteConstValue = React.useCallback(
        (ins: NodeInstance, pinId: string) => {
          const newValue = produce(node, (draft) => {
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
        [node, onChange, copiedConstValue]
      );

      const onAddIoPin = React.useCallback(
        async (type: PinType) => {
          const newPinId = await _prompt("New name?");

          if (!newPinId) {
            // name selection dismissed, cancelling
            return;
          }

          const newValue = produce(node, (draft) => {
            if (type === "input") {
              if (!node.inputs) {
                draft.inputs = {};
              }
              draft.inputs[newPinId] = nodeInput();
              draft.inputsPosition[newPinId] = lastMousePos.current;
            } else {
              if (!node.outputs) {
                draft.outputs = {};
              }
              draft.outputs[newPinId] = nodeOutput();
              draft.outputsPosition[newPinId] = lastMousePos.current;

              if (draft.completionOutputs?.length) {
                toastMsg(
                  "Note that this node has explicit completion outputs set. You may need to update them."
                );
              }
            }
          });

          onChange(newValue, functionalChange("add new io pin"));
          reportEvent("addIoPin", { type });
        },
        [_prompt, node, onChange, reportEvent]
      );

      const editCompletionOutputs = React.useCallback(async () => {
        const curr = node.completionOutputs?.join(",");
        const newVal = await _prompt(`Edit completion outputs`, curr);
        if (isDefined(newVal) && newVal !== null) {
          const newValue = produce(node, (draft) => {
            draft.completionOutputs =
              newVal === "" ? undefined : newVal.split(",");
          });

          onChange(newValue, functionalChange("change node completions"));
          reportEvent("editCompletionOutputs", {
            count: newVal ? newVal.split(",").length : 0,
          });
        }
      }, [_prompt, onChange, node, reportEvent]);

      const editReactiveInputs = React.useCallback(async () => {
        const curr = node.reactiveInputs?.join(",");
        const newVal = await _prompt(`Edit reactive inputs`, curr);
        if (isDefined(newVal) && newVal !== null) {
          const newValue = produce(node, (draft) => {
            draft.reactiveInputs =
              newVal === "" ? undefined : newVal.split(",");
          });

          onChange(newValue, functionalChange("change reactive inputs"));
          reportEvent("editReactiveInputs", {
            count: newVal ? newVal.split(",").length : 0,
          });
        }
      }, [_prompt, onChange, node, reportEvent]);

      const editNodeDescription = React.useCallback(async () => {
        const description = await _prompt(`Description?`, node.description);
        const newValue = produce(node, (draft) => {
          draft.description = description;
        });

        onChange(newValue, functionalChange("Edit node description"));
      }, [_prompt, onChange, node]);

      const onChangeDefaultStyle = React.useCallback(
        (style: NodeStyle) => {
          const newNode = produce(node, (draft) => {
            draft.defaultStyle = style;
          });
          onChange(newNode, functionalChange("change default style"));
          reportEvent("changeStyle", { isDefault: true });
        },
        [onChange, node, reportEvent]
      );

      const onRenameIoPin = React.useCallback(
        async (type: PinType, pinId: string) => {
          const newName = (await _prompt("New name?", pinId)) || pinId;
          const newValue = handleIoPinRename(node, type, pinId, newName);
          onChange(newValue, functionalChange("rename io pin"));
        },
        [node, onChange, _prompt]
      );

      const onChangeInputMode = React.useCallback(
        (pinId: string, mode: InputMode) => {
          const newValue = handleChangeNodeInputType(node, pinId, mode);
          onChange(newValue, functionalChange("toggle io pin optional"));
        },
        [node, onChange]
      );

      const onAction = React.useCallback(
        (action: Action) => {
          switch (action.type) {
            case ActionType.RemoveNode: {
              const newValue = produce(node, (draft) => {
                if (!isVisualNode(node)) {
                  throw new Error(
                    `Impossible state, deleting instances opf non visual node`
                  );
                }
                draft.instances = draft.instances.filter(
                  (ins) => !selected.includes(ins.id)
                );
                draft.connections = draft.connections.filter(
                  (conn) =>
                    !selected.includes(conn.from.insId) &&
                    !selected.includes(conn.to.insId)
                );
              });
              onChangeBoardData({ selected: [] });
              onChange(newValue, functionalChange("remove-instances"));

              toastMsg(`Removed ${selected.length} instances(s)`);
              reportEvent("deleteInstances", { count: selected.length });
              break;
            }
            case ActionType.Inspect: {
              if (selected.length === 1) {
                onInspectPin(selected[0]);
              } else if (from || to) {
                const conn = from ?? to;
                const insId = isExternalConnectionNode(conn)
                  ? ROOT_INS_ID
                  : conn.insId;
                onInspectPin(insId, {
                  type: from ? "output" : "input",
                  id: conn.pinId,
                });
              }
              reportEvent("openInspectMenu", { source: "actionMenu" });
              break;
            }
            case ActionType.Group: {
              void (async () => {
                await onGroupSelectedInternal();
              })();
              break;
            }
            case ActionType.UnGroup: {
              const instance = node.instances.find(
                (ins) => ins.id === selected[0]
              );
              onUnGroup(instance);
              const insNode = safelyGetNodeDef(
                instance,
                currResolvedDeps
              ) as VisualNode;
              toastMsg(`Ungrouped inline node ${insNode.id}`);
              reportEvent("unGroupNode", {
                instancesCount: insNode.instances.length,
              });
              break;
            }
            case ActionType.AddInlineValue: {
              setInlineCodeTarget({
                type: "new-floating",
                pos: lastMousePos.current,
              });
              reportEvent("addValueModalOpen", { source: "actionMenu" });
              break;
            }
            case ActionType.AddNode: {
              void (async function () {
                const pos = getMiddleOfViewPort(viewPort, vpSize);

                const { importableNode } = action.data;
                const depsWithImport = await onImportNode(importableNode);

                const targetPos = vSub(pos, { x: 0, y: 50 * viewPort.zoom }); // to account for node

                const newNodeIns = isMacroNodeDefinition(importableNode.node)
                  ? createNewMacroNodeInstance(
                      importableNode.node,
                      0,
                      targetPos
                    )
                  : createNewNodeInstance(
                      importableNode.node.id,
                      0,
                      targetPos,
                      depsWithImport
                    );
                const newNode = produce(node, (draft) => {
                  draft.instances.push(newNodeIns);
                });

                const newState = produce(boardData, (draft) => {
                  draft.selected = [newNodeIns.id];
                });

                onChange(newNode, functionalChange("add new instance"));

                onChangeBoardData(newState);

                toastMsg(
                  `Node ${importableNode.node.id} successfully imported from ${importableNode.module}`
                );

                if (isResolvedMacroNodeInstance(newNodeIns)) {
                  // hack to allow imported macro to appear in deps. TODO: fix
                  setTimeout(() => {
                    setEditedMacroInstance({ ins: newNodeIns });
                  }, 100);
                }
                reportEvent("addNode", {
                  nodeId: importableNode.node.id,
                  source: "actionMenu",
                });
              })();
              break;
            }
            case ActionType.AI: {
              void (async function () {
                const pos = getMiddleOfViewPort(viewPort, vpSize);

                const { importableNode } = action.data;
                const depsWithImport = await onImportNode(importableNode);

                const targetPos = vSub(pos, { x: 0, y: 50 * viewPort.zoom }); // to account for node

                const newNodeIns = createNewNodeInstance(
                  importableNode.node.id,
                  0,
                  targetPos,
                  depsWithImport
                );
                const newNode = produce(node, (draft) => {
                  draft.instances.push(newNodeIns);
                });

                const newState = produce(boardData, (draft) => {
                  draft.selected = [newNodeIns.id];
                });

                onChange(newNode, functionalChange("add new instance"));

                onChangeBoardData(newState);

                toastMsg(
                  `Node ${importableNode.node.id} successfully imported from ${importableNode.module}`
                );
                reportEvent("addNode", {
                  nodeId: importableNode.node.id,
                  source: "actionMenu",
                });
              })();
              break;
            }
            default: {
              toastMsg(`${action.type} not supported yet`);
            }
          }
        },
        [
          boardData,
          from,
          onChange,
          onChangeBoardData,
          onGroupSelectedInternal,
          onImportNode,
          onInspectPin,
          onUnGroup,
          node,
          currResolvedDeps,
          reportEvent,
          selected,
          to,
          viewPort,
          vpSize,
        ]
      );

      const renderNodeInputs = () => {
        const from = boardData.from;

        return entries(inputs).map(([k, v]) => (
          <NodeIoView
            currentInsId={currentInsId}
            ancestorInsIds={props.ancestorsInsIds}
            type="input"
            pos={inputsPosition[k] || { x: 0, y: 0 }}
            id={k}
            onDelete={nodeIoEditable ? onRemoveIoPin : undefined}
            onRename={nodeIoEditable ? onRenameIoPin : undefined}
            onDblClick={onMainInputDblClick}
            closest={
              !!(
                closestPin &&
                closestPin.type === "input" &&
                closestPin.ins.id === node.id &&
                closestPin.pin === k
              )
            }
            connected={false}
            inputMode={v.mode}
            onChangeInputMode={onChangeInputMode}
            key={k}
            viewPort={viewPort}
            onDragStart={onStartDraggingNodeIo}
            onDragEnd={onDragEndNodeIo}
            onDragMove={onDragMoveNodeIo}
            onSelect={onNodeIoPinClick}
            onSetDescription={onNodeIoSetDescription}
            selected={from?.pinId === k}
            description={v.description}
            onMouseUp={onNodeIoMouseUp}
            onMouseDown={onNodeIoMouseDown}
          />
        ));
      };

      const renderNodeOutputs = () => {
        const { to } = boardData;
        return entries(outputs).map(([k, v]) => (
          <NodeIoView
            currentInsId={currentInsId}
            ancestorInsIds={props.ancestorsInsIds}
            type="output"
            pos={outputsPosition[k] || { x: 0, y: 0 }}
            id={k}
            onDelete={nodeIoEditable ? onRemoveIoPin : undefined}
            onRename={nodeIoEditable ? onRenameIoPin : undefined}
            closest={
              !!(
                closestPin &&
                closestPin.type === "output" &&
                closestPin.ins.id === node.id &&
                closestPin.pin === k
              )
            }
            connected={false}
            key={k}
            viewPort={viewPort}
            onDragStart={onStartDraggingNodeIo}
            onDragEnd={onDragEndNodeIo}
            onDragMove={onDragMoveNodeIo}
            onSelect={onNodeIoPinClick}
            onSetDescription={onNodeIoSetDescription}
            description={v.description}
            selected={to?.pinId === k}
            onMouseUp={onNodeIoMouseUp}
            onMouseDown={onNodeIoMouseDown}
          />
        ));
      };

      const maybeRenderSelectionBox = () => {
        if (selectionBox) {
          const { from, to } = selectionBox;

          const realFrom = logicalPosToRenderedPos(from, viewPort);
          const realTo = logicalPosToRenderedPos(to, viewPort);

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
          ins: NodeInstance,
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
              value: normalizedValue ?? JSON.stringify("Some static value"),
            });
            reportEvent("addValueModalOpen", { source: "dblClickPin" });
          } else {
            const node = safelyGetNodeDef(ins, currResolvedDeps);
            const nodeOutputs = getNodeOutputs(node);
            const pin = nodeOutputs[pinId];

            if (!pin) {
              throw new Error("Dbl clicked on un-existing pin");
            }

            setQuickAddMenuVisible({
              pos: { x: e.clientX, y: e.clientY },
              ins,
              targetNode: node,
              pinId,
              pinType: type,
            });
          }
        },
        [currResolvedDeps, reportEvent]
      );

      const onMainInputDblClick = React.useCallback(
        async (pinId: string, e: React.MouseEvent) => {
          const pin = node.inputs[pinId];

          if (!pin) {
            throw new Error("Dbl clicked on un-existing pin");
          }

          setQuickAddMenuVisible({
            pos: { x: e.clientX, y: e.clientY },
            pinId,
            pinType: "input",
            targetNode: node,
          });
        },
        [node]
      );

      const onMaybeZoomOrPan = React.useCallback(
        (e: WheelEvent) => {
          if (e.metaKey || e.ctrlKey) {
            const zoomDiff = e.deltaY * -0.005;
            onZoom(viewPort.zoom + zoomDiff, "mouse");
            e.preventDefault();
            e.stopPropagation();
          } else {
            if (disableScrolling) {
              return;
            }
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
        [disableScrolling, onZoom, setViewPort, viewPort]
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
        backgroundSize: roundNumber(10 * viewPort.zoom) + "px",
      };

      // unoptimized code to get connected inputs
      const instancesConnectToPinsRef = React.useRef(
        new Map<string, Record<string, NodeInstance[]>>()
      );

      // prune orphan connections
      React.useEffect(() => {
        const validInputs = instances.reduce((acc, ins) => {
          const node = safelyGetNodeDef(ins, currResolvedDeps);
          if (node) {
            acc.set(ins.id, keys(getNodeInputs(node)));
          }
          return acc;
        }, new Map<string, string[]>());

        const validOutputs = instances.reduce((acc, ins) => {
          const node = safelyGetNodeDef(ins, currResolvedDeps);
          if (node) {
            acc.set(ins.id, keys(getNodeOutputs(node)));
          }
          return acc;
        }, new Map<string, string[]>());

        /* the nodes output are targets for connections therefore they are fed into the "validInputs" map */
        validInputs.set(THIS_INS_ID, keys(node.outputs));
        /* the nodes inputs are targets for connections therefore they are fed into the "validOutputs" map */
        validOutputs.set(THIS_INS_ID, keys(node.inputs));

        const orphanConnections = connections.filter((conn) => {
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
          console.warn(
            `${orphanConnections.length} orphan connections removed`,
            orphanConnections
          );

          const newNode = produce(node, (draft) => {
            draft.connections = node.connections.filter(
              (conn) => !orphanConnections.includes(conn)
            );
          });
          onChange(newNode, functionalChange("prune orphan connections"));
        }
      }, [instances, onChange, connections, node, currResolvedDeps]);

      // for each instance, if there's a visible input or output that doesn't exist, reset the visible inputs/outputs to be the full list
      React.useEffect(() => {
        let invalids = [];
        const newNode = produce(node, (draft) => {
          draft.instances = draft.instances.map((ins) => {
            const node = safelyGetNodeDef(ins, currResolvedDeps);
            if (node) {
              const nodeInputs = getNodeInputs(node);
              const nodeOutputs = getNodeOutputs(node);

              if (ins.visibleInputs) {
                const invalidInputs = ins.visibleInputs.filter(
                  (pinId) => !nodeInputs[pinId]
                );
                if (invalidInputs.length > 0) {
                  ins.visibleInputs = keys(nodeInputs);
                  invalids.push(...invalidInputs);
                }
              }

              if (ins.visibleOutputs) {
                const invalidOutputs = ins.visibleOutputs.filter(
                  (pinId) => !nodeOutputs[pinId]
                );
                if (invalidOutputs.length > 0) {
                  ins.visibleOutputs = keys(nodeOutputs);
                  invalids.push(...invalidOutputs);
                }
              }
            }
            return ins;
          });
        });
        if (invalids.length > 0) {
          toastMsg(
            `Found ${
              invalids.length
            } invalid visible inputs/outputs: ${invalids.join(
              ", "
            )}. Reset them`,
            "warning"
          );
          onChange(
            newNode,
            functionalChange("reset corrupt visible inputs/outputs")
          );
        }
      }, [instances, onChange, node, currResolvedDeps]);

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

          const { ins, pinId } = quickAddMenuVisible;

          switch (match.type) {
            case "import":
            case "node": {
              const deps =
                match.type === "import"
                  ? await onImportNode(match.importableNode)
                  : currResolvedDeps;

              const nodeToAdd =
                match.type === "import"
                  ? match.importableNode.node
                  : match.node;
              const newNodeIns = createNewNodeInstance(
                nodeToAdd.id,
                100,
                lastMousePos.current,
                deps
              );

              if (newNodeIns) {
                const newValue = produce(node, (draft) => {
                  draft.instances.push(newNodeIns);
                  draft.connections.push({
                    from: { insId: ins ? ins.id : THIS_INS_ID, pinId },
                    to: { insId: newNodeIns.id, pinId: TRIGGER_PIN_ID },
                  });
                });

                onChange(newValue, functionalChange("add-item-quick-menu"));
                onCloseQuickAdd();
              }
              reportEvent("addNode", {
                nodeId: nodeToAdd.id,
                source: "quickAdd",
              });
              break;
            }
            // case "import": {
            //   const deps = await onImportNode(match.importableNode);
            //   const newNodeIns = createNewNodeInstance(
            //     match.importableNode.node,
            //     100,
            //     lastMousePos.current,
            //     deps
            //   );

            //   const newValue = produce(node, (draft) => {
            //     draft.instances.push(newNodeIns);
            //     draft.connections.push({
            //       from: { insId: ins ? ins.id : THIS_INS_ID, pinId },
            //       to: { insId: newNodeIns.id, pinId: TRIGGER_PIN_ID },
            //     });
            //   });

            //   onChange(newValue, functionalChange("import-node-quick-menu"));

            //   onCloseQuickAdd();
            //   reportEvent("addNode", {
            //     nodeId: match.importableNode.node.id,
            //     source: "quickAdd",
            //   });
            //   break;
            // }
            case "value": {
              if (!ins) {
                toastMsg("Cannot add value to main input");
                return;
              }
              setInlineCodeTarget({ type: "new-output", insId: ins.id, pinId });
              reportEvent("addValueModalOpen", { source: "quickAdd" });
            }
          }
        },
        [
          quickAddMenuVisible,
          currResolvedDeps,
          reportEvent,
          node,
          onChange,
          onCloseQuickAdd,
          onImportNode,
        ]
      );

      const copyNodeToClipboard = React.useCallback(async () => {
        const str = JSON.stringify(node);
        await navigator.clipboard.writeText(str);
        AppToaster.show({ message: "Copied!" });
      }, [node]);

      const getContextMenu = React.useCallback(() => {
        const maybeDisabledLabel = nodeIoEditable
          ? ""
          : " (cannot edit main node, only visual)";

        return (
          <Menu>
            <MenuItem
              onMouseDown={(e) => e.stopPropagation()}
              text={"New Value"}
              onClick={preventDefaultAnd(() => {
                setInlineCodeTarget({
                  type: "new-floating",
                  pos: lastMousePos.current,
                });
                reportEvent("addValueModalOpen", { source: "contextMenu" });
              })}
            />
            <MenuItem
              text={`New input ${maybeDisabledLabel}`}
              onMouseDown={(e) => e.stopPropagation()}
              onClick={preventDefaultAnd(() => onAddIoPin("input"))}
              disabled={!nodeIoEditable}
            />
            <MenuItem
              onMouseDown={(e) => e.stopPropagation()}
              text={`New output ${maybeDisabledLabel}`}
              onClick={preventDefaultAnd(() => onAddIoPin("output"))}
              disabled={!nodeIoEditable}
            />
            <MenuItem
              onMouseDown={(e) => e.stopPropagation()}
              text={"Copy node to clipboard"}
              onClick={preventDefaultAnd(copyNodeToClipboard)}
            />
            <MenuItem
              onMouseDown={(e) => e.stopPropagation()}
              text={`Edit Completion Outputs (${
                node.completionOutputs?.join(",") || "n/a"
              })`}
              onClick={preventDefaultAnd(() => editCompletionOutputs())}
            />

            <MenuItem
              onMouseDown={(e) => e.stopPropagation()}
              text={`Edit Reactive inputs (${
                node.reactiveInputs?.join(",") || "n/a"
              })`}
              onClick={preventDefaultAnd(() => editReactiveInputs())}
            />
            <MenuItem
              onMouseDown={(e) => e.stopPropagation()}
              text={`Edit description`}
              onClick={preventDefaultAnd(() => editNodeDescription())}
            />
            <MenuDivider />
            <MenuItem text="Default Style">
              <NodeStyleMenu
                style={node.defaultStyle}
                onChange={onChangeDefaultStyle}
                promptFn={_prompt}
              />
            </MenuItem>
          </Menu>
        );
      }, [
        nodeIoEditable,
        copyNodeToClipboard,
        node.completionOutputs,
        node.reactiveInputs,
        node.defaultStyle,
        onChangeDefaultStyle,
        _prompt,
        reportEvent,
        onAddIoPin,
        editCompletionOutputs,
        editReactiveInputs,
        editNodeDescription,
      ]);

      useHotkeys(
        "shift+c",
        fitToScreen,
        { text: "Center viewport", group: "Viewport Controls" },
        [],
        isBoardInFocus
      );

      useHotkeys(
        "cmd+c",
        onCopyInner,
        { text: "Copy instances", group: "Editing" },
        [],
        isBoardInFocus
      );
      useHotkeys(
        "cmd+v",
        onPaste,
        { text: "Paste instances", group: "Editing" },
        [],
        isBoardInFocus
      );
      useHotkeys(
        "esc",
        clearSelections,
        { text: "Clear selections", group: "Selection" },
        [],
        isBoardInFocus
      );
      useHotkeys(
        "backspace",
        deleteSelection,
        { text: "Delete instances", group: "Editing" },
        [],
        isBoardInFocus
      );
      useHotkeys(
        "shift+d",
        duplicate,
        { text: "Duplicate selected instances", group: "Editing" },
        [],
        isBoardInFocus
      );
      useHotkeys(
        "cmd+a",
        selectAll,
        { text: "Select all", group: "Selection" },
        [],
        isBoardInFocus
      );
      useHotkeys(
        "s",
        selectClosest,
        { text: "Select pin closest to mouse", group: "Selection" },
        [],
        isBoardInFocus
      );

      const onChangeInspected: VisualNodeEditorProps["onChangeNode"] =
        React.useCallback(
          (changedInlineNode, type) => {
            if (!openInlineInstance) {
              throw new Error("impossible state");
            }
            const newNode = produce(node, (draft) => {
              const ins = draft.instances.find(
                (i) => i.id === openInlineInstance.insId
              );
              if (!ins || !isInlineNodeInstance(ins)) {
                throw new Error("impossible state");
              }
              ins.node = changedInlineNode;
            });

            onChange(
              newNode,
              functionalChange("Inner change: " + type.message)
            );
            setOpenInlineInstance((obj) => ({
              ...obj,
              node: changedInlineNode,
            }));
          },
          [onChange, openInlineInstance, node]
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

      const maybeGetInlineProps = (
        ins: NodeInstance
      ): VisualNodeEditorProps => {
        if (openInlineInstance && openInlineInstance.insId === ins.id) {
          return {
            currentInsId: openInlineInstance.insId,
            ancestorsInsIds: fullInsIdPath(currentInsId, ancestorsInsIds),
            boardData: inspectedBoardData,
            onChangeBoardData: onChangeInspectedBoardData,
            resolvedDependencies,
            onCopy: onCopy,
            clipboardData: props.clipboardData,
            onInspectPin: props.onInspectPin,
            onGoToNodeDef: props.onGoToNodeDef,
            nodeIoEditable: props.nodeIoEditable,
            node: openInlineInstance.node,
            onChangeNode: onChangeInspected,
            onShowOmnibar: onShowOmnibar,
            parentViewport: defaultViewPort,
            // parentViewport: viewPort, // this was needed when I rendered it completely inline
            parentBoardPos: boardPos,
            onExtractInlineNode: props.onExtractInlineNode,
            queuedInputsData: props.queuedInputsData,
          };
        } else {
          return undefined;
        }
      };

      const maybeGetFutureConnection = () => {
        if (
          from &&
          ((closestPin?.type === "input" && closestPin?.ins.id !== node.id) ||
            (closestPin?.ins.id === node.id && closestPin?.type === "output"))
        ) {
          const to: ConnectionNode =
            closestPin.ins.id === node.id
              ? { pinId: closestPin.pin, insId: THIS_INS_ID }
              : { insId: closestPin.ins.id, pinId: closestPin.pin };

          if (
            !isInternalConnectionNode(to) &&
            !isInternalConnectionNode(from)
          ) {
            // hack to fix the fact main output / main input could connect to each other
            return undefined;
          }
          return { from, to };
        } else if (
          to &&
          ((closestPin?.type === "output" && closestPin?.ins.id !== node.id) ||
            (closestPin?.ins.id === node.id && closestPin?.type === "input"))
        ) {
          const from: ConnectionNode =
            closestPin.ins.id === node.id
              ? { pinId: closestPin.pin, insId: THIS_INS_ID }
              : { insId: closestPin.ins.id, pinId: closestPin.pin };

          if (
            !isInternalConnectionNode(to) &&
            !isInternalConnectionNode(from)
          ) {
            // hack to fix the fact main output / main input could connect to each other
            return undefined;
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
        (ins: NodeInstance, inputs: string[]) => {
          const newNode = produce(node, (draft) => {
            draft.instances = draft.instances.map((i) => {
              return i.id === ins.id ? { ...i, visibleInputs: inputs } : i;
            });
          });
          onChange(newNode, functionalChange("change instance visible inputs"));
        },
        [node, onChange]
      );

      const onChangeInstanceStyle = React.useCallback(
        (instance: NodeInstance, style: NodeStyle) => {
          const newNode = produce(node, (draft) => {
            draft.instances = draft.instances.map((ins) => {
              return ins.id === instance.id ? { ...ins, style } : ins;
            });
          });
          onChange(newNode, functionalChange("change instance style"));
          reportEvent("changeStyle", { isDefault: false });
        },
        [onChange, node, reportEvent]
      );

      const onChangeVisibleOutputs = React.useCallback(
        (ins: NodeInstance, outputs: string[]) => {
          const newNode = produce(node, (draft) => {
            draft.instances = draft.instances.map((i) => {
              return i.id === ins.id ? { ...i, visibleOutputs: outputs } : i;
            });
          });
          onChange(
            newNode,
            functionalChange("change instance visible outputs")
          );
        },
        [node, onChange]
      );

      const onChangeInstanceDisplayName = React.useCallback(
        (ins: NodeInstance, name: string) => {
          const newNode = produce(node, (draft) => {
            draft.instances = draft.instances.map((i) => {
              return i.id === ins.id ? { ...i, displayName: name } : i;
            });
          });
          onChange(newNode, functionalChange("change instance display name"));
        },
        [node, onChange]
      );

      React.useImperativeHandle(thisRef, () => {
        const ref: VisualNodeEditorHandle = {
          centerInstance(insId: string) {
            const ins = node.instances.find((ins) => ins.id === insId);
            if (ins) {
              const pos = vSub(
                ins.pos,
                vec(vpSize.width / 2, vpSize.height / 2)
              );
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
          requestNewInlineValue: () => {
            setInlineCodeTarget({
              type: "new-floating",
              pos: lastMousePos.current,
            });
          },
        };
        return ref;
      });

      // use this to debug positioning/layout related stuff
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const [layoutDebuggers, setLayoutDebuggers] = React.useState<
        Array<Omit<LayoutDebuggerProps, "viewPort">>
      >([]);

      const onSaveInlineValueNode = React.useCallback(
        (type: InlineValueNodeType, code: string) => {
          const customView = code.trim().substr(0, 100);
          const nodeId = `Inline-value-${customView
            .substr(0, 15)
            .replace(/["'`]/g, "")}`;

          const newNode = createInlineValueNode({
            code,
            customView,
            nodeId,
            type,
          });

          switch (inlineCodeTarget.type) {
            case "existing": {
              const [existingInlineNode] = node.instances
                .filter((ins) => ins.id === inlineCodeTarget.insId)
                .filter((ins) => isInlineNodeInstance(ins))
                .map((ins: InlineNodeInstance) => ins.node);

              if (!existingInlineNode) {
                throw new Error(`Unable to find inline node to save to`);
              }

              const oldInputs = keys(existingInlineNode.inputs);
              const newInputs = keys(newNode.inputs);

              const removedInputs = new Set(_.difference(oldInputs, newInputs));

              const newVal = produce(node, (draft) => {
                draft.instances = draft.instances.map((i) => {
                  return i.id === inlineCodeTarget.insId
                    ? inlineNodeInstance(i.id, newNode, i.inputConfig, i.pos)
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

              const newVal = produce(node, (draft) => {
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
              const ins = inlineNodeInstance(
                createInsId(newNode),
                newNode,
                {},
                inlineCodeTarget.pos
              );
              const newVal = produce(node, (draft) => {
                draft.instances.push(ins);
              });
              onChange(newVal, functionalChange("new floating value"));
              setInlineCodeTarget(undefined);
              break;
            }
            case "new-output": {
              const { insId, pinId } = inlineCodeTarget;
              const existingIns = node.instances.find((i) => i.id === insId);
              if (!existingIns) {
                throw new Error(`Impossible state`);
              }
              const newIns = inlineNodeInstance(
                createInsId(newNode),
                newNode,
                {},
                vAdd(existingIns.pos, { x: -50, y: 150 })
              );
              const newVal = produce(node, (draft) => {
                draft.instances.push(newIns);
                draft.connections.push({
                  from: connectionNode(insId, pinId),
                  to: connectionNode(newIns.id, TRIGGER_PIN_ID),
                });
              });
              onChange(
                newVal,
                functionalChange("new value connected to output")
              );
              setInlineCodeTarget(undefined);
            }
          }

          reportEvent("addValue", {
            type,
            placeholdersCount: keys(newNode.inputs).length,
          });
        },
        [inlineCodeTarget, onChange, node, reportEvent]
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
          const val = produce(node, (draft) => {
            const conn = draft.connections.find((conn) =>
              connectionDataEquals(conn, connection)
            );
            conn.hidden = !conn.hidden;
          });
          onChange(val, functionalChange("toggle connection hidden"));
        },
        [onChange, node]
      );

      const removeConnection = React.useCallback(
        (connection: ConnectionData) => {
          const val = produce(node, (draft) => {
            draft.connections = draft.connections.filter(
              (conn) => !connectionDataEquals(conn, connection)
            );
          });
          onChange(val, functionalChange("remove connection"));
        },
        [onChange, node]
      );

      const onPinMouseDown = React.useCallback<
        InstanceViewProps["onPinMouseDown"]
      >((ins, pinId, pinType) => {
        if (pinType === "input") {
          setDraggedConnection({
            to: connectionNode(ins.id, pinId),
            from: undefined,
          });
        } else {
          setDraggedConnection({
            from: connectionNode(ins.id, pinId),
            to: undefined,
          });
        }
      }, []);

      const onPinMouseUp = React.useCallback<InstanceViewProps["onPinMouseUp"]>(
        (ins, pinId, pinType) => {
          if (draggedConnection) {
            if (draggedConnection.from && pinType === "input") {
              onConnectionClose(
                draggedConnection.from,
                connectionNode(ins.id, pinId),
                "pinDrag"
              );
            } else if (draggedConnection.to && pinType === "output") {
              onConnectionClose(
                connectionNode(ins.id, pinId),
                draggedConnection.to,
                "pinDrag"
              );
            }
          }
          setDraggedConnection(null);
        },
        [draggedConnection, onConnectionClose]
      );

      const onNodeIoMouseDown = React.useCallback<
        NodeIoViewProps["onMouseDown"]
      >((id, type) => {
        // drag to connect disabled in node io pins as they conflict with the drag to move
        // whole concept of "Node IO" probably needs to be rethought
      }, []);

      const onNodeIoMouseUp = React.useCallback<NodeIoViewProps["onMouseUp"]>(
        (id, type) => {
          if (draggedConnection) {
            if (draggedConnection.from && type === "output") {
              onConnectionClose(
                draggedConnection.from,
                externalConnectionNode(id),
                "nodeIoPinDrag"
              );
            } else if (draggedConnection.to && type === "input") {
              onConnectionClose(
                externalConnectionNode(id),
                draggedConnection.to,
                "nodeIoPinDrag"
              );
            }
          }
        },
        [draggedConnection, onConnectionClose]
      );

      const onSaveMacroInstance: MacroInstanceEditorProps["onSubmit"] =
        React.useCallback(
          (val) => {
            const newVal = produce(node, (draft) => {
              const ins = draft.instances.find(
                (i) => i.id === editedMacroInstance.ins.id
              );
              if (!ins || !isMacroNodeInstance(ins)) {
                throw new Error(`Impossible state`);
              }
              ins.macroData = val;
            });
            onChange(newVal, functionalChange("save macro instance"));
            setEditedMacroInstance(undefined);
          },
          [node, onChange, editedMacroInstance]
        );

      try {
        return (
          <ContextMenu
            className={classNames("visual-node-editor", props.className, {
              dark: darkMode,
            })}
            data-id={node.id}
            content={getContextMenu()}
            disabled={!isBoardInFocus.current}
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
                  node={node}
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
                resolvedNodes={currResolvedDeps}
                currentInsId={currentInsId}
                ancestorsInsIds={ancestorsInsIds}
                size={vpSize}
                node={node}
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
                lastMousePos={lastMousePos.current}
                draggedSource={draggedConnection}
              />
              {renderNodeInputs()}
              {instances.map((ins) => (
                <InstanceView
                  onUngroup={onUnGroup}
                  onExtractInlineNode={onExtractInlineNode}
                  onDetachConstValue={onDetachConstValue}
                  onCopyConstValue={onCopyConstValue}
                  onPasteConstValue={onPasteConstValue}
                  copiedConstValue={copiedConstValue}
                  connectionsPerInput={
                    instancesConnectToPinsRef.current.get(ins.id) || emptyObj
                  }
                  node={safelyGetNodeDef(ins, currResolvedDeps)}
                  ancestorsInsIds={fullInsIdPath(currentInsId, ancestorsInsIds)}
                  onPinClick={onPinClick}
                  onPinDblClick={onPinDblClick}
                  onDragStart={onStartDraggingInstance}
                  onDragEnd={onInstanceDragEnd}
                  resolvedDeps={currResolvedDeps}
                  onDragMove={onInstanceDragMove}
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
                  queuedInputsData={queueInputsData[ins.id] ?? emptyObj}
                  instance={ins}
                  connections={connections}
                  // was too lazy to remove/fix the breakpoint/log below
                  onTogglePinBreakpoint={noop}
                  onTogglePinLog={noop}
                  // onTogglePinLog={onToggleLog}
                  // onTogglePinBreakpoint={onToggleBreakpoint}
                  viewPort={viewPort}
                  onChangeVisibleInputs={onChangeVisibleInputs}
                  onChangeVisibleOutputs={onChangeVisibleOutputs}
                  onSetDisplayName={onChangeInstanceDisplayName}
                  onDeleteInstance={onDeleteInstance}
                  key={ins.id}
                  forceShowMinimized={
                    from || draggedConnection?.to?.insId === ins.id
                      ? "input"
                      : to || draggedConnection?.from?.insId === ins.id
                      ? "output"
                      : undefined
                  }
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
                  onPinMouseDown={onPinMouseDown}
                  onPinMouseUp={onPinMouseUp}
                  hadError={
                    props.instancesWithErrors?.has(fullInsIdPath(ins.id)) ??
                    false
                  }
                />
              ))}
              {maybeRenderSelectionBox()}
              {/* {maybeRenderEditGroupModal()} */}
              {renderNodeOutputs()}
              <MainInstanceEventsIndicator
                currentInsId={currentInsId}
                ancestorsInsIds={ancestorsInsIds}
                viewPort={viewPort}
              />
              {quickAddMenuVisible ? (
                <QuickAddMenu
                  targetNode={quickAddMenuVisible.targetNode}
                  pinId={quickAddMenuVisible.pinId}
                  pinType={quickAddMenuVisible.pinType}
                  pos={quickAddMenuVisible.pos}
                  resolvedDependencies={resolvedDependencies}
                  node={node}
                  onAdd={onQuickAdd}
                  onClose={onCloseQuickAdd}
                />
              ) : null}
              <div className="viewport-controls-and-help">
                <Button small onClick={fitToScreen} minimal intent="primary">
                  Center
                </Button>
                <MemodSlider
                  min={0.15}
                  max={3}
                  stepSize={0.05}
                  labelStepSize={10}
                  labelRenderer={sliderRenderer}
                  onChange={onZoom}
                  value={viewPort.zoom}
                />
                {isRootInstance ? <HelpBubble /> : null}
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
                  onSubmit={onSaveInlineValueNode}
                />
              ) : null}
              {editedMacroInstance ? (
                <MacroInstanceEditor
                  onCancel={() => setEditedMacroInstance(undefined)}
                  onSubmit={onSaveMacroInstance}
                  ins={editedMacroInstance.ins}
                  deps={resolvedDependencies}
                />
              ) : null}
              <div className="inline-editor-portal-root" />
            </main>
            <ActionsMenu
              showRunFlowOptions={isRootInstance}
              onAction={onAction}
              selectedInstances={selected}
              node={node}
              resolvedNodes={currResolvedDeps}
              to={to}
              from={from}
              hotkeysEnabled={isBoardInFocus}
            />
          </ContextMenu>
        );
      } catch (e) {
        console.error(e);
        return <div>Error rendering board - {(e as any).toString()}</div>;
      }
    })
  );

const isEventOnCurrentBoard = (
  e: KeyboardEvent | MouseEvent,
  nodeId: string
) => {
  const targetElem = e.target as Element;
  const closestBoard = targetElem.closest(".visual-node-editor");

  return closestBoard && closestBoard.getAttribute("data-id") === nodeId;
};
