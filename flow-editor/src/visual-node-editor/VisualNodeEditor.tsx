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
  InputMode,
  isVisualNode,
  connectionDataEquals,
  ConnectionNode,
  delay,
  noop,
  keys,
  TRIGGER_PIN_ID,
  isInlineNodeInstance,
  isRefNodeInstance,
  InlineNodeInstance,
  connectionNode,
  ImportedNodeDef,
  NodeStyle,
  getNodeOutputs,
  Pos,
  getNodeInputs,
  externalConnectionNode,
  ResolvedDependenciesDefinitions,
  fullInsIdPath,
  isStickyInputPinConfig,
  stickyInputPinConfig,
  isMacroNodeInstance,
  isResolvedMacroNodeInstance,
  ResolvedMacroNodeInstance,
  isMacroNodeDefinition,
  ImportableSource,
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
  getInstancePinConfig,
  changePinConfig,
  createNewMacroNodeInstance,
  fitViewPortToRect,
  getConnectionId
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

import { groupSelected } from "../group-selected";
import { useConfirm, usePorts, usePrompt } from "../flow-editor/ports";
import classNames from "classnames";
import { pasteInstancesCommand } from "./commands/paste-instances";

import { handleConnectionCloseEditorCommand } from "./commands/close-connection";
import { handleDuplicateSelectedEditorCommand } from "./commands/duplicate-instances";
import { NodeStyleMenu } from "./instance-view/NodeStyleMenu";
import { useDependenciesContext } from "../flow-editor/FlowEditor";
import { MainInstanceEventsIndicator } from "./MainInstanceEventsIndicator";
import { HelpBubble } from "./HelpBubble";
import { safelyGetNodeDef } from "../flow-editor/getNodeDef";
import { useDarkMode } from "../flow-editor/DarkModeContext";
import {
  MacroInstanceEditor,
  MacroInstanceEditorProps,
} from "./MacroInstanceEditor";
import {
  SelectionIndicator,
  SelectionIndicatorProps,
} from "./SelectionIndicator";
import { NodesLibrary } from "./NodesLibrary";
import { RunFlowModal } from "./RunFlowModal";

import { Play } from "@blueprintjs/icons";
import { AddMainPinModal } from "./AddMainPinModal";

const MemodSlider = React.memo(Slider);

const sliderRenderer = () => null;

export const NODE_HEIGHT = 28;

export const defaultViewPort: ViewPort = {
  pos: { x: 0, y: 0 },
  zoom: 1,
};

export const defaultBoardData: GroupEditorBoardData = {
  selectedInstances: [],
  selectedConnections: [],
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
  selectedInstances: string[];
  selectedConnections: string[];
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

  className?: string;

  parentViewport?: ViewPort;
  parentBoardPos?: Pos;

  queuedInputsData?: Record<string, Record<string, number>>;
  instancesWithErrors?: Set<string>;

  initialPadding?: [number, number];
  disableScrolling?: boolean;
};

export interface VisualNodeEditorHandle {
  centerInstance(insId: string): void;
  centerViewPort(): void;
  getViewPort(): ViewPort;
  clearSelection(): void;
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
        resolvedDependencies,
        queuedInputsData: queueInputsData,
        initialPadding,
        disableScrolling,
      } = props;

      const { onImportNode, libraryData } = useDependenciesContext();

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

      const {
        selectedConnections,
        selectedInstances,
        from,
        to,
      } = boardData;
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

      const [lastSelectedId, setLastSelectedId] = useState<string>(); // to avoid it disappearing when doubling clicking to edit

      const [didCenterInitially, setDidCenterInitially] = useState(false);

      const [runModalVisible, setRunModalVisible] = useState(false);

      const [addMainPinModalVisibleType, setAddMainPinModalVisibleType] =
        useState<PinType | undefined>();

      const [quickAddMenuVisible, setQuickAddMenuVisible] =
        useState<QuickAddMenuData>();

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

          onChange(newNode, functionalChange("close-connection"));
          onChangeBoardData({ from: undefined, to: undefined });
          reportEvent("createConnection", { source });
        },
        [onChange, onChangeBoardData, node, reportEvent]
      );

      const onGroupSelectedInternal = React.useCallback(async () => {
        const name = await _prompt("New visual node name?");
        if (!name) return;
        const { currentNode } = await groupSelected(
          boardData.selectedInstances,
          node,
          name,
          "inline",
          _prompt
        );
        onChange(currentNode, functionalChange("group node"));

        onChangeBoardData({ selectedInstances: [] });

        toastMsg("Node grouped");

        reportEvent("groupSelected", {
          count: boardData.selectedInstances.length,
        });
      }, [
        _prompt,
        boardData.selectedInstances,
        node,
        onChange,
        onChangeBoardData,
        reportEvent,
      ]);

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
              onChangeBoardData({
                to,
                selectedInstances: [],
                selectedConnections: [],
              });
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
              onChangeBoardData({
                from,
                selectedInstances: [],
                selectedConnections: [],
              });
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
        const { selectedInstances } = boardData;
        const instances = node.instances
          .filter((ins) => selectedInstances.includes(ins.id))
          .map((ins) => ({ ...ins, id: ins.id + "-copy" }));
        const connections = node.connections.filter(({ from, to }) => {
          return selectedInstances.includes(from.insId) && selectedInstances.includes(to.insId);
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

        onChangeBoardData({
          selectedInstances: newInstances.map((ins) => ins.id),
          selectedConnections: [],
        });
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
          selectedInstances: [],
          selectedConnections: [],
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
            selectedInstances,
            draggingId
          );
          onChange(newValue, metaChange("drag-move"));
          if (newSelected) {
            onChangeBoardData({
              selectedInstances: newSelected,
              selectedConnections: [],
            });
          }
        },
        [draggingId, onChange, onChangeBoardData, selectedInstances, node]
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

      const onSelectConnection = React.useCallback(
        (connection: ConnectionData, ev: React.MouseEvent) => {
          const connectionId = getConnectionId(connection);
          const newSelected = selectedConnections.includes(connectionId)
            ? selectedConnections.filter((id) => id !== connectionId)
            : [...(ev.shiftKey ? selectedConnections : []), connectionId];

          onChangeBoardData({
            selectedConnections: newSelected,
            selectedInstances: [],
          });
        },
        [onChangeBoardData, selectedConnections]
      );

      const onSelectInstance = React.useCallback(
        ({ id }: NodeInstance, ev: React.MouseEvent) => {
          const newSelectedIfSelectionExists = ev.shiftKey
            ? selectedInstances.filter((sid) => sid !== id)
            : [];
          const newSelectedIfSelectionIsNew = ev.shiftKey
            ? [...selectedInstances, id]
            : [id];
          const newSelected = selectedInstances.includes(id)
            ? newSelectedIfSelectionExists
            : newSelectedIfSelectionIsNew;

          onChangeBoardData({
            selectedInstances: newSelected,
            selectedConnections: [],
            from: undefined,
            to: undefined,
          });
        },
        [onChangeBoardData, selectedInstances]
      );

      const selectAll = React.useCallback(() => {
        const allIds = node.instances.map((i) => i.id);
        onChangeBoardData({
          selectedInstances: allIds,
          selectedConnections: [],
          from: undefined,
          to: undefined,
        });
      }, [onChangeBoardData, node.instances]);

      const onDeleteInstances = React.useCallback(
        (ids: string[]) => {
          const newConnections = connections.filter(({ from, to }) => {
            return (
              !ids.includes(getConnectionId({ from, to })) &&
              !ids.includes(from.insId) &&
              !ids.includes(to.insId)
            );
          });

          const newValue = produce(node, (draft) => {
            draft.connections = newConnections;
            draft.instances = draft.instances.filter(
              (_ins) => !ids.includes(_ins.id)
            );
          });

          onChangeBoardData({ selectedInstances: [], selectedConnections: [] });
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
        const {
          selectedConnections,
          selectedInstances,
          from,
          to,
        } = boardData;
        const idsToDelete = [...selectedInstances, ...selectedConnections];
        if (idsToDelete.length === 0) {
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
          onDeleteInstances(idsToDelete);
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
          selectedInstances
        );

        onChange(newNode, functionalChange("duplicated instances"));
        onChangeBoardData({
          selectedInstances: newInstances.map((ins) => ins.id),
        });
        // onChange(duplicateSelected(value), functionalChange("duplicate"));
      }, [onChange, onChangeBoardData, node, selectedInstances]);

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

          const allowedSelectionBoxClasses = [
            "board-editor-inner",
            "connections-view",
          ];

          if (
            target &&
            allowedSelectionBoxClasses.includes(target.getAttribute("class"))
          ) {
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
        [node.id, viewPort, boardPos, parentViewport]
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
                ? [...selectedInstances, ...toSelect]
                : toSelect;
              onChangeBoardData({ selectedInstances: newSelected });
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
          selectedInstances,
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
              if (isVisualNode(node)) {
                setOpenInlineInstance({ insId: ins.id, node });
              } else {
                toastMsg("Editing this type of node is not supported");
              }
              return;
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
            onChangeBoardData({ selectedInstances: [] });
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

      const onAddMainPin = React.useCallback(
        (type: PinType, newPinId: string) => {
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
          setAddMainPinModalVisibleType(undefined);
        },
        [node, onChange, reportEvent]
      );

      const onCloseAddMainPinModal = React.useCallback(() => {
        setAddMainPinModalVisibleType(undefined);
      }, []);

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

      const onAddNode = React.useCallback(
        async (importableNode: ImportableSource) => {
          const depsWithImport = await onImportNode(importableNode);

          const targetPos = vSub(lastMousePos.current, {
            x: 200,
            y: 50 * viewPort.zoom,
          }); // to account for node

          const newNodeIns = isMacroNodeDefinition(importableNode.node)
            ? createNewMacroNodeInstance(importableNode.node, 0, targetPos)
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
            draft.selectedInstances = [newNodeIns.id];
          });

          onChange(newNode, functionalChange("add new instance"));

          onChangeBoardData(newState);

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
        },
        [
          boardData,
          node,
          onChange,
          onChangeBoardData,
          onImportNode,
          reportEvent,
          viewPort.zoom,
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
            // this used to open the static value modal, but now that it was removed, we just do nothing
            // TODO - support a shortcut to static values here
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
        [currResolvedDeps]
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
                  ins.visibleInputs = undefined;
                  invalids.push(...invalidInputs);
                }
              }

              if (ins.visibleOutputs) {
                const invalidOutputs = ins.visibleOutputs.filter(
                  (pinId) => !nodeOutputs[pinId]
                );
                if (invalidOutputs.length > 0) {
                  ins.visibleOutputs = undefined;
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
            )}. Resetting to full list`,
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

              // Do nothing, we don't support static values anymore
              // TODO - find what to do here
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
              text={`New main input ${maybeDisabledLabel}`}
              onMouseDown={(e) => e.stopPropagation()}
              onClick={preventDefaultAnd(() =>
                setAddMainPinModalVisibleType("input")
              )}
              disabled={!nodeIoEditable}
            />
            <MenuItem
              onMouseDown={(e) => e.stopPropagation()}
              text={`New main output ${maybeDisabledLabel}`}
              onClick={preventDefaultAnd(() =>
                setAddMainPinModalVisibleType("output")
              )}
              disabled={!nodeIoEditable}
            />
            <MenuItem
              onMouseDown={(e) => e.stopPropagation()}
              text={`Integrate with existing code (docs link)`}
              href="https://www.flyde.dev/docs/integrate-flows/"
              target="_blank"
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
          selectedInstances: [],
          selectedConnections: [],
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
        };
        return ref;
      });

      // use this to debug positioning/layout related stuff
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const [layoutDebuggers, setLayoutDebuggers] = React.useState<
        Array<Omit<LayoutDebuggerProps, "viewPort">>
      >([]);

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

      const selectionIndicatorData: SelectionIndicatorProps["selection"] =
        React.useMemo(() => {
          if (from) {
            return { type: "input" as const, pinId: from.pinId };
          } else if (to) {
            return { type: "output" as const, pinId: to.pinId };
          } else if (selectedInstances.length > 0) {
            return { type: "instances" as const, ids: selectedInstances };
          } else if (selectedConnections.length > 0) {
            return { type: "connections" as const, ids: selectedConnections };
          } else {
            return undefined;
          }
        }, [selectedInstances, from, to]);

      const onCenterSelection = React.useCallback(() => {
        if (selectionIndicatorData) {
          const { type } = selectionIndicatorData;

          const pos = (() => {
            switch (type) {
              case "instances": {
                const ins = node.instances.find((ins) =>
                  selectedInstances.includes(ins.id)
                );
                if (ins) {
                  return ins.pos;
                }
                break;
              }
              case "input": {
                const pos = inputsPosition[selectionIndicatorData.pinId];
                if (pos) {
                  return pos;
                }
                break;
              }
              case "output": {
                const pos = outputsPosition[selectionIndicatorData.pinId];
                if (pos) {
                  return pos;
                }
                break;
              }
            }
          })();
          const vp = fitViewPortToRect(
            { x: pos.x, y: pos.y, w: 1, h: 1 },
            vpSize
          );
          vp.zoom = viewPort.zoom;
          animateViewPort(viewPort, vp, 500, (vp) => {
            setViewPort(vp);
          });
        }
      }, [
        inputsPosition,
        node.instances,
        outputsPosition,
        selectedInstances,
        selectionIndicatorData,
        setViewPort,
        viewPort,
        vpSize,
      ]);

      const closeRunModal = React.useCallback(() => {
        setRunModalVisible(false);
      }, []);

      const openRunModal = React.useCallback(() => {
        setRunModalVisible(true);
      }, []);

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
                selectedInstances={selectedInstances}
                selectedConnections={selectedConnections}
                toggleHidden={toggleConnectionHidden}
                removeConnection={removeConnection}
                onSelectConnection={onSelectConnection}
                lastMousePos={lastMousePos.current}
                draggedSource={draggedConnection}
              />
              {renderNodeInputs()}
              {instances.map((ins) => (
                <InstanceView
                  onUngroup={onUnGroup}
                  onExtractInlineNode={onExtractInlineNode}
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
                  selected={selectedInstances.indexOf(ins.id) !== -1}
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
                  isConnectedInstanceSelected={selectedInstances.some((selInsId) =>
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
            {selectionIndicatorData ? (
              <SelectionIndicator
                selection={selectionIndicatorData}
                onCenter={onCenterSelection}
                onGroup={onGroupSelectedInternal}
                onDelete={onDeleteInstances}
              />
            ) : null}
            {!openInlineInstance && libraryData.groups.length ? (
              <NodesLibrary {...libraryData} onAddNode={onAddNode} />
            ) : null}
            <div className="run-btn-container">
              <Button
                className="run-btn"
                onClick={openRunModal}
                rightIcon={<Play />}
                small
              >
                Test Flow
              </Button>
            </div>
            {runModalVisible ? (
              <RunFlowModal node={node} onClose={closeRunModal} />
            ) : null}
            {addMainPinModalVisibleType ? (
              <AddMainPinModal
                type={addMainPinModalVisibleType}
                onAdd={onAddMainPin}
                onClose={onCloseAddMainPinModal}
              />
            ) : null}
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
