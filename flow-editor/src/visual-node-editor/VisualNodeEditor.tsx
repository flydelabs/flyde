import * as React from "react";

import {
  THIS_INS_ID,
  ConnectionData,
  isInternalConnectionNode,
  VisualNode,
  NodeInstance,
  PinType,
  isVisualNode,
  connectionDataEquals,
  ConnectionNode,
  noop,
  TRIGGER_PIN_ID,
  isInlineNodeInstance,
  isRefNodeInstance,
  InlineNodeInstance,
  connectionNode,
  ImportedNodeDef,
  getNodeOutputs,
  Pos,
  getNodeInputs,
  externalConnectionNode,
  fullInsIdPath,
  isMacroNodeInstance,
  isResolvedMacroNodeInstance,
  ResolvedMacroNodeInstance,
  ImportedNode,
} from "@flyde/core";

import { InstanceView, InstanceViewProps } from "./instance-view/InstanceView";
import {
  ConnectionView,
  ConnectionViewProps,
} from "./connection-view/ConnectionView";
import { entries, Size } from "../utils";
import { useBoundingclientrect, useDidMount } from "rooks";

import {
  emptyObj,
  createNewNodeInstance,
  ViewPort,
  roundNumber,
  fitViewPortToNode,
  handleInstanceDrag,
  emptyList,
  animateViewPort,
  fitViewPortToRect,
  isEventOnCurrentBoard,
} from "./utils";

import { OnboardingTips } from "./OnboardingTips";

import { produce } from "immer";
import { useState, useRef, useEffect, DragEvent } from "react";
import { useHotkeys } from "../lib/react-utils/use-hotkeys";
import useComponentSize from "@rehooks/component-size";

import { Slider, ContextMenu, Button } from "@blueprintjs/core";
import { NodeIoView, NodeIoViewProps } from "./node-io-view";

import { vec, vSub, vZero } from "../physics";
import {
  QuickAddMenu,
  QuickAddMenuData,
  QuickMenuMatch,
} from "./quick-add-menu";
import { LayoutDebugger, LayoutDebuggerProps } from "./layout-debugger";
import { preloadMonaco } from "../lib/preload-monaco";
// import { InstancePanel } from "./instance-panel";
import { toastMsg } from "../toaster";
import {
  functionalChange,
  metaChange,
} from "../flow-editor/flyde-flow-change-type";

import { usePorts } from "../flow-editor/ports";
import classNames from "classnames";
import { pasteInstancesCommand } from "./commands/paste-instances";

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
import { EditorContextMenu } from "./EditorContextMenu/EditorContextMenu";
import { usePruneOrphanConnections } from "./usePruneOrphanConnections";
import { SelectionBox } from "./SelectionBox/SelectionBox";
import { useSelectionBox } from "./useSelectionBox";
import { useClosestPinAndMousePos } from "./useClosestPinAndMousePos";
import {
  useVisualNodeEditorContext,
  VisualNodeEditorContextType,
} from "./VisualNodeEditorContext";
import { useEditorCommands } from "./useEditorCommands";

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
  currentInsId: string;
  ancestorsInsIds?: string;

  clipboardData: ClipboardData;

  nodeIoEditable: boolean;
  thumbnailMode?: true;

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
        nodeIoEditable,
        onCopy,
        onGoToNodeDef: onEditNode,
        onInspectPin,
        currentInsId,
        ancestorsInsIds,
        queuedInputsData: queueInputsData,
        initialPadding,
      } = props;

      const { resolvedDependencies } = useDependenciesContext();

      const {
        node,
        onChangeNode: onChange,
        boardData,
        onChangeBoardData,
      } = useVisualNodeEditorContext();

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

      const { selectedConnections, selectedInstances, from, to } = boardData;
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

      const isRootInstance = ancestorsInsIds === undefined;

      const [lastSelectedId, setLastSelectedId] = useState<string>(); // to avoid it disappearing when doubling clicking to edit

      const [didCenterInitially, setDidCenterInitially] = useState(false);

      const [runModalVisible, setRunModalVisible] = useState(false);

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

      useEffect(() => {
        if (lastSelectedId) {
          const t = setTimeout(() => {
            setLastSelectedId(undefined);
          }, 350);

          return () => clearTimeout(t);
        }
      }, [lastSelectedId]);

      const boardRef = useRef<HTMLDivElement>();
      const vpSize: Size = useComponentSize(boardRef);
      const boardPos = useBoundingclientrect(boardRef) || vZero;

      const { closestPin, lastMousePos, updateClosestPinAndMousePos } =
        useClosestPinAndMousePos(
          node,
          currResolvedDeps,
          currentInsId,
          ancestorsInsIds,
          viewPort,
          boardPos,
          parentViewport
        );

      useEffect(() => {
        preloadMonaco();
      }, []);

      const {
        selectionBox,
        startSelectionBox,
        updateSelectionBox,
        endSelectionBox,
      } = useSelectionBox(
        node,
        currResolvedDeps,
        boardData.viewPort,
        boardPos,
        parentViewport
      );

      const {
        onRenameIoPin,
        onChangeInputMode,
        onToggleSticky,
        onRemoveIoPin,
        onUnGroup,
        onNodeIoSetDescription,
        onChangeInstanceDisplayName,
        onChangeVisibleInputs,
        onChangeVisibleOutputs,
        onChangeInstanceStyle,
        onDeleteInstances,
        onAddNode,
        onSelectInstance,
        onDeleteInstance,
        onSelectConnection,
        onZoom,
        clearSelections,
        onConnectionClose,
        onGroupSelectedInternal,
        onNodeIoPinClick,
        onPinClick,
      } = useEditorCommands(
        lastMousePos,
        vpSize,
        isBoardInFocus,
        setEditedMacroInstance
      );

      const fitToScreen = () => {
        const vp = fitViewPortToNode(node, currResolvedDeps, vpSize);

        animateViewPort(viewPort, vp, 500, (vp) => {
          setViewPort(vp);
        });
      };

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
          return (
            selectedInstances.includes(from.insId) &&
            selectedInstances.includes(to.insId)
          );
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
      }, [
        node,
        lastMousePos,
        props.clipboardData,
        onChange,
        onChangeBoardData,
      ]);

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

          onChange(newValue, metaChange("node-io-drag-move"));
        },
        [onChange, node]
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

      const [isPanning, setIsPanning] = useState(false);
      const [isSpacePressed, setIsSpacePressed] = useState(false);
      const panStartPos = useRef<Pos | null>(null);

      const onMouseDown: React.MouseEventHandler = React.useCallback(
        (e) => {
          if (
            e.button !== 0 ||
            !isEventOnCurrentBoard(e.nativeEvent, node.id)
          ) {
            return;
          }
          if (isSpacePressed) {
            setIsPanning(true);
            panStartPos.current = { x: e.clientX, y: e.clientY };
          } else {
            startSelectionBox(e);
          }
        },
        [node.id, startSelectionBox, isSpacePressed]
      );

      const onMouseUp: React.MouseEventHandler = React.useCallback(
        (e) => {
          setDraggedConnection(null);
          setIsPanning(false);
          panStartPos.current = null;
          if (!isEventOnCurrentBoard(e.nativeEvent, node.id)) {
            return;
          }

          if (!isSpacePressed) {
            endSelectionBox(e.shiftKey, (ids) => {
              onChangeBoardData({ selectedInstances: ids });
            });
          }
        },
        [node.id, endSelectionBox, onChangeBoardData, isSpacePressed]
      );

      const onMouseMove: React.MouseEventHandler = React.useCallback(
        (e) => {
          if (!isEventOnCurrentBoard(e.nativeEvent, node.id)) {
            isBoardInFocus.current = false;
            return;
          }
          isBoardInFocus.current = true;

          updateClosestPinAndMousePos(e);

          if (isPanning && panStartPos.current) {
            const dx = (panStartPos.current.x - e.clientX) / viewPort.zoom;
            const dy = (panStartPos.current.y - e.clientY) / viewPort.zoom;
            setViewPort({
              ...viewPort,
              pos: {
                x: viewPort.pos.x + dx,
                y: viewPort.pos.y + dy,
              },
            });
            panStartPos.current = { x: e.clientX, y: e.clientY };
          } else if (selectionBox) {
            updateSelectionBox(lastMousePos.current);
          }

          onChangeBoardData({ lastMousePos: lastMousePos.current });
        },
        [
          node.id,
          updateClosestPinAndMousePos,
          selectionBox,
          onChangeBoardData,
          lastMousePos,
          updateSelectionBox,
          isPanning,
          viewPort,
          setViewPort,
        ]
      );

      const onMouseLeave: React.MouseEventHandler = React.useCallback((e) => {
        if ((e.relatedTarget as any)?.className === "bp5-menu") {
          // hack to ignore context menu opening as mouse leave
          return;
        }

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

      const renderMainPins = (type: PinType) => {
        const from = boardData.from;

        const pins = type === "input" ? inputs : outputs;
        const positionMap = type === "input" ? inputsPosition : outputsPosition;
        const selectionPinId = type === "input" ? from?.pinId : to?.pinId;

        return entries(pins).map(([k, v]) => (
          <NodeIoView
            currentInsId={currentInsId}
            ancestorInsIds={props.ancestorsInsIds}
            type={type}
            pos={positionMap[k] || { x: 0, y: 0 }}
            id={k}
            onDelete={nodeIoEditable ? onRemoveIoPin : undefined}
            onRename={nodeIoEditable ? onRenameIoPin : undefined}
            onDblClick={onMainInputDblClick}
            closest={
              !!(
                closestPin &&
                closestPin.type === type &&
                closestPin.ins.id === node.id &&
                closestPin.pin === k
              )
            }
            connected={false}
            inputMode={v.mode}
            onChangeInputMode={type === "input" ? onChangeInputMode : undefined}
            key={k}
            viewPort={viewPort}
            onDragStart={onStartDraggingNodeIo}
            onDragEnd={onDragEndNodeIo}
            onDragMove={onDragMoveNodeIo}
            onSelect={onNodeIoPinClick}
            onSetDescription={onNodeIoSetDescription}
            selected={selectionPinId === k}
            description={v.description}
            onMouseUp={onNodeIoMouseUp}
            onMouseDown={onNodeIoMouseDown}
          />
        ));
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
        backgroundSize: roundNumber(10 * viewPort.zoom) + "px",
      };

      // unoptimized code to get connected inputs
      const instancesConnectToPinsRef = React.useRef(
        new Map<string, Record<string, NodeInstance[]>>()
      );

      // auto prune orphan connections if their inputs/outputs no longer exist
      usePruneOrphanConnections(
        instances,
        connections,
        node,
        currResolvedDeps,
        onChange
      );

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
          onImportNode,
          currResolvedDeps,
          lastMousePos,
          reportEvent,
          node,
          onChange,
          onCloseQuickAdd,
        ]
      );

      const getContextMenu = React.useCallback(() => {
        return (
          <EditorContextMenu
            nodeIoEditable={nodeIoEditable}
            lastMousePos={lastMousePos}
          />
        );
      }, [nodeIoEditable, lastMousePos]);

      useHotkeys(
        "shift+c",
        fitToScreen,
        { text: "Center viewport", group: "Viewport Controls" },
        [],
        isBoardInFocus
      );

      useHotkeys(
        "cmd+c, ctrl+c",
        onCopyInner,
        { text: "Copy instances", group: "Editing" },
        [],
        isBoardInFocus
      );
      useHotkeys(
        "cmd+v, ctrl+v",
        onPaste,
        { text: "Paste instances", group: "Editing" },
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

      const onChangeInspected: VisualNodeEditorContextType["onChangeNode"] =
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
      ): VisualNodeEditorProps & VisualNodeEditorContextType => {
        if (openInlineInstance && openInlineInstance.insId === ins.id) {
          return {
            currentInsId: openInlineInstance.insId,
            ancestorsInsIds: fullInsIdPath(currentInsId, ancestorsInsIds),
            boardData: inspectedBoardData,
            onChangeBoardData: onChangeInspectedBoardData,
            onCopy: onCopy,
            clipboardData: props.clipboardData,
            onInspectPin: props.onInspectPin,
            onGoToNodeDef: props.onGoToNodeDef,
            nodeIoEditable: props.nodeIoEditable,
            node: openInlineInstance.node,
            onChangeNode: onChangeInspected,
            parentViewport: defaultViewPort,
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
        }, [from, to, selectedInstances, selectedConnections]);

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

      const onDragOver = React.useCallback((e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
      }, []);

      const onDrop = React.useCallback(
        (e: DragEvent<HTMLDivElement>) => {
          e.preventDefault();
          const data = e.dataTransfer.getData("application/json");
          if (data) {
            const droppedNode = JSON.parse(data) as ImportedNode;
            const rect = boardRef.current.getBoundingClientRect();
            const x = (e.clientX - rect.left) / viewPort.zoom + viewPort.pos.x;
            const y = (e.clientY - rect.top) / viewPort.zoom + viewPort.pos.y;

            onAddNode(
              {
                module: "@flyde/stdlib",
                node: droppedNode,
              },
              { x, y }
            );
          }
        },
        [onAddNode, viewPort]
      );

      useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
          if (e.code === "Space" && !isSpacePressed) {
            setIsSpacePressed(true);
          }
        };

        const handleKeyUp = (e: KeyboardEvent) => {
          if (e.code === "Space") {
            setIsSpacePressed(false);
            setIsPanning(false);
          }
        };

        window.addEventListener("keydown", handleKeyDown);
        window.addEventListener("keyup", handleKeyUp);

        return () => {
          window.removeEventListener("keydown", handleKeyDown);
          window.removeEventListener("keyup", handleKeyUp);
        };
      }, [isSpacePressed]);

      const cursorStyle = isSpacePressed
        ? isPanning
          ? "grabbing"
          : "grab"
        : "default";

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
              onDragOver={onDragOver}
              onDrop={onDrop}
              ref={boardRef as any}
              style={{
                ...backgroundStyle,
                cursor: cursorStyle,
              }}
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
              {renderMainPins("input")}
              {instances.map((ins) => (
                <InstanceView
                  onUngroup={onUnGroup}
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
                  isConnectedInstanceSelected={selectedInstances.some(
                    (selInsId) =>
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
              <SelectionBox selectionBox={selectionBox} viewPort={viewPort} />
              {/* {maybeRenderEditGroupModal()} */}
              {renderMainPins("output")}
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
            <OnboardingTips />
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
          </ContextMenu>
        );
      } catch (e) {
        console.error(e);
        return <div>Error rendering board - {(e as any).toString()}</div>;
      }
    })
  );
