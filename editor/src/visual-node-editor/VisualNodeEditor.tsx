import * as React from "react";

import {
  THIS_INS_ID,
  isInlineVisualNodeInstance,
  isCodeNodeInstance,
  ConnectionData,
  isInternalConnectionNode,
  NodeInstance,
  PinType,
  isVisualNode,
  connectionDataEquals,
  ConnectionNode,
  noop,
  connectionNode,
  Pos,
  getNodeInputs,
  externalConnectionNode,
  fullInsIdPath,
  NodeDefinition,
  getNodeOutputs,
  EditorVisualNode,
  EditorNodeInstance,
  FlydeFlow,
  isVisualNodeInstance,
  ImportableEditorNode,
  EditorCodeNodeDefinition,
  FlydeNode,
  EditorCodeNodeInstance,
  NodeOrConfigurableDefinition,
} from "@flyde/core";

import { InstanceView, InstanceViewProps } from "./instance-view/InstanceView";
import {
  ConnectionView,
  ConnectionViewProps,
} from "./connection-view/ConnectionView";
import { entries, Size } from "../utils";

import {
  ContextMenu,
  ContextMenuTrigger,
  HotkeyIndication,
  Plus,
} from "../ui";
import { useBoundingclientrect, useDidMount } from "rooks";

import {
  emptyObj,
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

import { NodeIoView, NodeIoViewProps } from "./node-io-view";

import { vec, vSub, vZero, vAdd } from "../physics";
import { LayoutDebugger, LayoutDebuggerProps } from "./layout-debugger";
import { preloadMonaco } from "../lib/preload-monaco";
// import { InstancePanel } from "./instance-panel";
import {
  functionalChange,
  metaChange,
} from "../flow-editor/flyde-flow-change-type";

import { usePorts } from "../flow-editor/ports";
import classNames from "classnames";
import { pasteInstancesCommand } from "./commands/paste-instances";

import { HelpBubble } from "./HelpBubble";
import { useDarkMode } from "../flow-editor/DarkModeContext";
import {
  InstanceConfigEditor,
  InstanceConfigEditorProps,
} from "./InstanceConfigEditor";
import {
  SelectionIndicator,
  SelectionIndicatorProps,
} from "./SelectionIndicator";
import { RunFlowModal } from "./RunFlowModal";

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
import { CustomNodeModal } from "./CustomNodeModal/CustomNodeModal";
import { Button, Slider, Toaster, useToast, Play } from "../ui";
import { CommandMenu } from "./CommandMenu/CommandMenu";

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
  onInspectPin: (insId: string, pin: { id: string; type: PinType }) => void;

  className?: string;

  parentViewport?: ViewPort;
  parentBoardPos?: Pos;

  queuedInputsData?: Record<string, Record<string, number>>;
  instancesWithErrors?: Set<string>;

  initialPadding?: [number, number];
  requireModifierForZoom?: boolean;

  tempFlow?: FlydeFlow;
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
        onInspectPin,
        currentInsId,
        ancestorsInsIds,
        queuedInputsData: queueInputsData,
        initialPadding,
        requireModifierForZoom,
      } = props;

      const { toast } = useToast();

      const {
        node,
        onChangeNode: onChange,
        boardData,
        onChangeBoardData,
      } = useVisualNodeEditorContext();

      const darkMode = useDarkMode();

      const { onCreateCustomNode, resolveInstance } = usePorts();

      const parentViewport = props.parentViewport || defaultViewPort;

      const { selectedConnections, selectedInstances, from, to } = boardData;
      const {
        instances,
        connections,
        inputsPosition,
        outputsPosition,
        inputs,
        outputs,
      } = node;

      const [draggingId, setDraggingId] = useState<string>();

      const isRootInstance = ancestorsInsIds === undefined;

      const [lastSelectedId, setLastSelectedId] = useState<string>(); // to avoid it disappearing when doubling clicking to edit

      const [didCenterInitially, setDidCenterInitially] = useState(false);

      const [runModalVisible, setRunModalVisible] = useState(false);

      const [openInlineInstance, setOpenInlineInstance] = useState<{
        node: EditorVisualNode;
        insId: string;
      }>();

      const [editedNodeInstance, setEditedNodeInstance] = useState<{
        ins: EditorCodeNodeInstance;
      }>();

      const [isAddingCustomNode, setIsAddingCustomNode] = useState(false);
      const [customNodeForkData, setCustomNodeForkData] = useState<{
        node: NodeOrConfigurableDefinition;
        initialCode: string;
      }>();

      const inlineEditorPortalRootRef = useRef<HTMLElement | null>(null);

      useDidMount(() => {
        inlineEditorPortalRootRef.current = boardRef.current?.querySelector(
          ".inline-editor-portal-root"
        ) ?? null;
      });

      const viewPort = boardData.viewPort;

      const isBoardInFocus = useRef(true);

      const [draggedConnection, setDraggedConnection] = useState<
        | null
        | { from: ConnectionNode; to: undefined }
        | { to: ConnectionNode; from: undefined }
      >(null);

      const setViewPort = React.useCallback(
        (viewPort: ViewPort) => {
          onChangeBoardData({ viewPort });
        },
        [onChangeBoardData]
      );

      const isLikelyTrackpad = React.useRef(false);

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

      const boardRef = useRef<HTMLDivElement>(null);
      const vpSize: Size = useComponentSize(boardRef);
      const boardPos = useBoundingclientrect(boardRef) || vZero;

      const { closestPin, lastMousePos, updateClosestPinAndMousePos } =
        useClosestPinAndMousePos(
          node,
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
      } = useSelectionBox(node, boardData.viewPort, boardPos, parentViewport);

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
        isBoardInFocus
      );

      const fitToScreen = () => {
        const vp = fitViewPortToNode(node, vpSize);

        animateViewPort(viewPort, vp, 500, (vp) => {
          setViewPort(vp);
        });
      };

      useEffect(() => {
        if (!didCenterInitially && vpSize.width) {
          const vp = fitViewPortToNode(node, vpSize, initialPadding);
          setViewPort(vp);
          // hackidy hack
          const timer = setTimeout(() => {
            const vp = fitViewPortToNode(node, vpSize, initialPadding);
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
        onChange(
          newNode as EditorVisualNode,
          functionalChange("paste instances")
        );

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
        (ins: EditorNodeInstance, event: any, pos: Pos) => {
          const newValue = handleInstanceDrag(
            node,
            ins,
            pos,
            event,
            selectedInstances,
            draggingId
          );
          onChange(newValue, metaChange("drag-move"))
        },
        [draggingId, onChange, selectedInstances, node]
      );

      const onInstanceDragEnd = React.useCallback((_: any, event: any) => {
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

          // Calculate the delta from the original position
          const currentPos = type === "input"
            ? node.inputsPosition[pin]
            : node.outputsPosition[pin];

          if (!currentPos) return;

          const delta = {
            x: x - currentPos.x,
            y: y - currentPos.y
          };

          const ioId = `io_${type}_${pin}`;

          const newValue = produce(node, (draft) => {
            // Update the dragged pin
            if (type === "input") {
              draft.inputsPosition[pin] = { x, y };
            } else {
              draft.outputsPosition[pin] = { x, y };
            }

            // Update other selected elements if this pin is part of a selection
            if (selectedInstances.includes(ioId)) {
              // Move other selected IO pins
              selectedInstances.forEach(id => {
                // Skip the pin being dragged
                if (id === ioId) return;

                // Handle other input pins
                if (id.startsWith('io_input_')) {
                  const pinId = id.substring('io_input_'.length);
                  if (draft.inputsPosition[pinId]) {
                    draft.inputsPosition[pinId] = vAdd(draft.inputsPosition[pinId], delta);
                  }
                }
                // Handle other output pins
                else if (id.startsWith('io_output_')) {
                  const pinId = id.substring('io_output_'.length);
                  if (draft.outputsPosition[pinId]) {
                    draft.outputsPosition[pinId] = vAdd(draft.outputsPosition[pinId], delta);
                  }
                }
                // Handle selected regular instances
                else {
                  const ins = draft.instances.find(ins => ins.id === id);
                  if (ins) {
                    ins.pos = vAdd(ins.pos, delta);
                  }
                }
              });
            }
          });

          onChange(newValue, metaChange("node-io-drag-move"));
        },
        [onChange, node, selectedInstances]
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
      const panStartPos = useRef<Pos | null>(null);

      const onMouseDown: React.MouseEventHandler = React.useCallback(
        (e) => {
          if (
            e.button !== 0 ||
            !isEventOnCurrentBoard(e.nativeEvent, node.id)
          ) {
            return;
          }
          if (e.shiftKey) {
            if (e.target) {
              const el = e.target as HTMLElement;
              if (el.classList.contains("connections-view")) {
                onChangeBoardData({
                  selectedInstances: [],
                  selectedConnections: [],
                  from: undefined,
                  to: undefined,
                });
                startSelectionBox(e);
              }
            }
          } else {
            // Default to panning only if the click is on the background
            if (e.target) {
              const el = e.target as HTMLElement;
              if (el.classList.contains("connections-view")) {
                setIsPanning(true);
                panStartPos.current = { x: e.clientX, y: e.clientY };
              }
            }
          }
        },
        [node.id, onChangeBoardData, startSelectionBox]
      );

      const onMouseUp: React.MouseEventHandler = React.useCallback(
        (e) => {
          setDraggedConnection(null);
          setIsPanning(false);
          panStartPos.current = null;
          if (!isEventOnCurrentBoard(e.nativeEvent, node.id)) {
            return;
          }

          if (selectionBox) {
            endSelectionBox(e.shiftKey, (ids) => {
              onChangeBoardData({ selectedInstances: ids });
            });
          }
        },
        [node.id, endSelectionBox, onChangeBoardData, selectionBox]
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
        (ins: EditorNodeInstance, shift: boolean) => {

          if (shift) {
            if (!isVisualNode(ins.node as FlydeNode)) {
              toast({
                description: "Cannot inspect a non visual node",
                variant: "default",
              });
              //`Impossible state inspecting visual node`);
              return;
            }

            setOpenInlineInstance({
              insId: `${currentInsId}.${ins.id}`,
              node: ins.node as any,
            });
          } else {
            if (isCodeNodeInstance(ins)) {
              setEditedNodeInstance({ ins: ins as EditorCodeNodeInstance });
            } else if (isVisualNodeInstance(ins)) {
              if (isVisualNode(ins.node as any) && ins.source.type === "inline") {
                setOpenInlineInstance({ insId: ins.id, node: ins.node as any });
              } else {
                toast({
                  description: "Editing this type of node is not supported",
                  variant: "default",
                });
              }
              return;
            } else {
              toast({
                description: "Editing this type of node is not supported",
                variant: "default",
              });
            }
          }
        },
        [currentInsId, toast]
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
            closest={
              !!(
                closestPin &&
                closestPin.type === type &&
                closestPin.ins.id === node.id &&
                closestPin.pin === k
              )
            }
            connected={false}
            onChangeInputMode={type === "input" ? onChangeInputMode : undefined}
            key={k}
            viewPort={viewPort}
            onDragStart={onStartDraggingNodeIo}
            onDragEnd={onDragEndNodeIo}
            onDragMove={onDragMoveNodeIo}
            onSelect={(id, type, event) => onNodeIoPinClick(id, type, event)}
            onSetDescription={onNodeIoSetDescription}
            selected={selectionPinId === k || selectedInstances.includes(`io_${type}_${k}`)}
            description={v.description ?? ''}
            onMouseUp={onNodeIoMouseUp}
            onMouseDown={onNodeIoMouseDown}
            increasedDropArea={!!draggedConnection}
          />
        ));
      };

      const onMaybeZoomOrPan = React.useCallback(
        (e: WheelEvent) => {
          const scrollThreshold = 0.5; // Ignore very small deltas
          
          // If requireModifierForZoom is true, only zoom when modifier key is pressed
          const shouldZoom = requireModifierForZoom ? (e.ctrlKey || e.metaKey) : true;
          
          if (!shouldZoom) {
            // Allow the event to bubble up for normal page scrolling
            return;
          }

          e.preventDefault();
          e.stopPropagation();

          if (e.ctrlKey || e.metaKey) { // Explicit zoom gesture (pinch or cmd/ctrl+scroll)
            if (Math.abs(e.deltaY) > scrollThreshold) {
              const zoomDiff = e.deltaY * -0.005; // Sensitivity for pinch
              onZoom(viewPort.zoom + zoomDiff, "mouse");
            }
          } else {
            // Handle Vertical Scroll (Zoom) - only when requireModifierForZoom is false
            if (Math.abs(e.deltaY) > scrollThreshold) {
              const zoomDiff = e.deltaY * -0.01; // Sensitivity for scroll zoom
              onZoom(viewPort.zoom + zoomDiff, "mouse");
            }
          }
        },
        [onZoom, viewPort, requireModifierForZoom]
      );

      useEffect(() => {
        const { current } = boardRef;
        if (current) {
          // Use passive: false since we call preventDefault
          current.addEventListener("wheel", onMaybeZoomOrPan, { passive: false });

          return () => {
            // Ensure the listener is removed with the same options
            current.removeEventListener("wheel", onMaybeZoomOrPan, { capture: false } as any);
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
        new Map<string, Record<string, NodeInstance[]>>()
      );

      // auto prune orphan connections if their inputs/outputs no longer exist
      usePruneOrphanConnections(instances, connections, node, onChange);

      // for each instance, if there's a visible input or output that doesn't exist, reset the visible inputs/outputs to be the full list
      React.useEffect(() => {
        let invalids: string[] = [];
        const newNode = produce(node, (draft) => {
          draft.instances = draft.instances.map((ins, idx) => {
            const node = ins.node;
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
          toast({
            description: `Found ${invalids.length
              } invalid visible inputs/outputs: ${invalids.join(
                ", "
              )}. Resetting to full list`,
            variant: "default",
          });

          onChange(
            newNode,
            functionalChange("reset corrupt visible inputs/outputs")
          );
        }
      }, [instances, onChange, node, toast, node.instances]);

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

      useHotkeys(
        "cmd+k, ctrl+k",
        (e) => {
          e.preventDefault();
          setCommandMenuOpen(true);
        },
        { text: "Open command menu", group: "General" },
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
              if (!ins || !isInlineVisualNodeInstance(ins)) {
                throw new Error("impossible state");
              }
              ins.source.data = changedInlineNode;
            });

            onChange(
              newNode,
              functionalChange("Inner change: " + type.message)
            );
            setOpenInlineInstance((obj) => ({
              ...obj,
              node: changedInlineNode,
              insId: openInlineInstance.insId
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

      const onChangeInspectedBoardData = React.useCallback((partial: Partial<GroupEditorBoardData>) => {
        return setInspectedBoardData((data) => ({ ...data, ...partial }));
      }, []);

      const maybeGetInlineProps = (
        ins: NodeInstance
      ): (VisualNodeEditorProps & VisualNodeEditorContextType) | undefined => {
        if (openInlineInstance && openInlineInstance.insId === ins.id) {
          return {
            currentInsId: openInlineInstance.insId,
            ancestorsInsIds: fullInsIdPath(currentInsId, ancestorsInsIds),
            boardData: inspectedBoardData,
            onChangeBoardData: onChangeInspectedBoardData,
            onCopy: onCopy,
            clipboardData: props.clipboardData,
            onInspectPin: props.onInspectPin,
            nodeIoEditable: props.nodeIoEditable,
            node: openInlineInstance.node,
            onChangeNode: onChangeInspected,
            parentViewport: defaultViewPort,
            parentBoardPos: boardPos,
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

          // Prevent connection between main input and output
          if (from.insId === THIS_INS_ID && to.insId === THIS_INS_ID) {
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

          // Prevent connection between main input and output
          if (from.insId === THIS_INS_ID && to.insId === THIS_INS_ID) {
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
            if (!conn) {
              console.warn("connection not found", connection);
              return;
            }
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
        if (type === "input") {
          setDraggedConnection({
            to: externalConnectionNode(id),
            from: undefined,
          });
        } else {
          setDraggedConnection({
            from: externalConnectionNode(id),
            to: undefined,
          });
        }
      }, []);

      const onNodeIoMouseUp = React.useCallback<NodeIoViewProps["onMouseUp"]>(
        (id, type) => {
          if (draggedConnection) {
            if (draggedConnection.from && type === "input") {
              onConnectionClose(
                draggedConnection.from,
                externalConnectionNode(id),
                "nodeIoPinDrag"
              );
            } else if (draggedConnection.to && type === "output") {
              onConnectionClose(
                externalConnectionNode(id),
                draggedConnection.to,
                "nodeIoPinDrag"
              );
            }
          }
          setDraggedConnection(null);
        },
        [draggedConnection, onConnectionClose]
      );

      const onSaveInstanceConfig: InstanceConfigEditorProps["onSubmit"] =
        React.useCallback(
          (val) => {
            if (!editedNodeInstance) {
              throw new Error("impossible state");
            }

            const newInstance = { ...editedNodeInstance.ins, config: val };

            return resolveInstance({ instance: newInstance }).then((resolvedNode) => {
              const newNode = produce(node, (draft) => {
                const ins: EditorNodeInstance | undefined = draft.instances.find(
                  (i) => i.id === editedNodeInstance.ins.id
                );

                if (!ins || !isCodeNodeInstance(ins)) {
                  throw new Error(`Impossible state`);
                }

                ins.config = newInstance.config;
                ins.node = resolvedNode.node;
              });

              onChange(newNode, functionalChange("save macro instance"));
              setEditedNodeInstance(undefined);
            }).catch(error => {
              console.error("Failed to resolve instance:", error);
              throw error;
            });
          },
          [editedNodeInstance, resolveInstance, node, onChange]
        );

      const selectionIndicatorData: SelectionIndicatorProps["selection"] =
        React.useMemo(() => {
          if (from) {
            return { type: "input" as const, pinId: from.pinId };
          } else if (to) {
            return { type: "output" as const, pinId: to.pinId };
          } else if (selectedInstances.length > 0) {
            // Filter out IO pins from regular instances
            const regularInstances = selectedInstances.filter(
              id => !id.startsWith('io_input_') && !id.startsWith('io_output_')
            );

            // If we have a mix of regular instances and IO pins, or just multiple IO pins,
            // treat them all as instances for selection purposes
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

          if (!pos) {
            return;
          }

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
            const droppedNode = JSON.parse(data) as ImportableEditorNode;
            onAddNode(droppedNode);
          }
        },
        [onAddNode]
      );

      const onSaveCustomNode = React.useCallback(
        async (code: string) => {
          const node = await onCreateCustomNode({ code });
          // console.log("node", node);
          // await onImportNode(node);
          await onAddNode(node);
          setIsAddingCustomNode(false);
        },
        [onAddNode, onCreateCustomNode]
      );

      const onViewForkCode = React.useCallback(
        async (instance: EditorNodeInstance) => {
          const node = instance.node;

          if (isVisualNode(node as FlydeNode)) {
            toast({
              description: "Visual nodes cannot be forked yet",
              variant: "destructive",
            });
            return;
          }

          const codeNodeDef = node as EditorCodeNodeDefinition;
          try {
            if (!codeNodeDef.sourceCode) {
              toast({
                description: "No source code found",
                variant: "destructive",
              });
              return;
            }
            setCustomNodeForkData({
              node: codeNodeDef,
              initialCode: codeNodeDef.sourceCode,
            });
            setIsAddingCustomNode(true);
          } catch (e) {
            console.error("Failed to get node source:", e);
          }
        },
        [toast]
      );

      const [commandMenuOpen, setCommandMenuOpen] = useState(false);

      try {
        return (
          <ContextMenu>
            <ContextMenuTrigger
              className={classNames("visual-node-editor", props.className, {
                dark: darkMode
              })}
              data-id={node.id}
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
                  cursor: isPanning ? 'grabbing' : 'default',
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
                  currentInsId={currentInsId}
                  ancestorsInsIds={ancestorsInsIds}
                  size={vpSize}
                  node={node}
                  boardPos={boardPos}
                  instances={node.instances}
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
                {instances.map((ins, idx) => (
                  <InstanceView
                    onUngroup={onUnGroup}
                    connectionsPerInput={
                      instancesConnectToPinsRef.current.get(ins.id) || emptyObj
                    }
                    ancestorsInsIds={fullInsIdPath(
                      currentInsId,
                      ancestorsInsIds
                    )}
                    onPinClick={onPinClick}
                    onPinDblClick={noop}
                    onDragStart={onStartDraggingInstance}
                    onDragEnd={onInstanceDragEnd}
                    onDragMove={onInstanceDragMove}
                    onDblClick={onDblClickInstance}
                    onSelect={onSelectInstance}
                    onToggleSticky={onToggleSticky}
                    selected={selectedInstances.indexOf(ins.id) !== -1}
                    dragged={draggingId === ins.id}
                    increasedPinDropArea={!!draggedConnection}
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
                    queuedInputsData={queueInputsData?.[ins.id] ?? emptyObj}
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
                      from || draggedConnection?.from
                        ? "input"
                        : to || draggedConnection?.to
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
                    inlineEditorPortalDomNode={
                      inlineEditorPortalRootRef.current
                    }
                    onChangeStyle={onChangeInstanceStyle}
                    onGroupSelected={onGroupSelectedInternal}
                    onPinMouseDown={onPinMouseDown}
                    onPinMouseUp={onPinMouseUp}
                    onViewForkCode={onViewForkCode}
                    hadError={
                      props.instancesWithErrors?.has(fullInsIdPath(ins.id)) ??
                      false
                    }
                  />
                ))}
                <SelectionBox selectionBox={selectionBox} viewPort={viewPort} />
                {/* {maybeRenderEditGroupModal()} */}
                {renderMainPins("output")}
                <div className="absolute top-4 right-5 z-10">
                  <Button
                    variant="outline"
                    onClick={() => setCommandMenuOpen(true)}
                    className="add-nodes border shadow-sm relative group inline-flex items-center gap-1 dark:bg-neutral-900 dark:border-neutral-950 px-2 h-8 dark:hover:bg-neutral-950 bg-neutral-100 border-neutral-200 hover:border-neutral-300"
                  >
                    <span className="size-5">
                      <Plus className="w-5 h-5 dark:text-white text-neutral-800" />
                    </span>{" "}
                    <HotkeyIndication hotkey="cmd+K" />
                  </Button>
                </div>
                <div className="viewport-controls-and-help">
                  <Button variant="ghost" size="sm" onClick={fitToScreen}>
                    Center
                  </Button>
                  <Slider
                    min={0.3}
                    max={2}
                    step={0.05}
                    className="w-[100px]"
                    value={[viewPort.zoom]}
                    onValueChange={([value]) => onZoom(value ?? 0)}
                  />
                  {isRootInstance ? <HelpBubble /> : null}
                </div>
                {editedNodeInstance ? (
                  <InstanceConfigEditor
                    onCancel={() => setEditedNodeInstance(undefined)}
                    onSubmit={onSaveInstanceConfig}
                    ins={editedNodeInstance.ins}
                    editorNode={node}
                    onFork={onViewForkCode}
                  />
                ) : null}
                <div className="inline-editor-portal-root" />
                <CommandMenu
                  open={commandMenuOpen}
                  onOpenChange={setCommandMenuOpen}
                  onAddNode={onAddNode}
                  onClickCustomNode={() => setIsAddingCustomNode(true)}
                />
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
              {isAddingCustomNode ? (
                <CustomNodeModal
                  isOpen={isAddingCustomNode}
                  onClose={() => {
                    setIsAddingCustomNode(false);
                    setCustomNodeForkData(undefined);
                  }}
                  onSave={onSaveCustomNode}
                  forkMode={customNodeForkData}
                />
              ) : null}
              <div className="run-btn-container">
                <Button
                  className="run-btn absolute top-4 left-1/2 -translate-x-1/2 z-10"
                  onClick={openRunModal}
                  size="sm"
                  variant="outline"
                >
                  <Play className="mr h-3 w-3" />
                  Test Flow
                </Button>
              </div>
              {runModalVisible ? (
                <RunFlowModal node={node} onClose={closeRunModal} />
              ) : null}
            </ContextMenuTrigger>
            <EditorContextMenu
              nodeIoEditable={nodeIoEditable}
              lastMousePos={lastMousePos}
              onOpenNodesLibrary={() => setCommandMenuOpen(true)}
            />
            <Toaster />
          </ContextMenu>
        );
      } catch (e) {
        console.error(e);
        return <div>Error rendering board - {(e as any).toString()}</div>;
      }
    })
  );


