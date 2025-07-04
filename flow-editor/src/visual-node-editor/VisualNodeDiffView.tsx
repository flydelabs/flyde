import * as React from "react";
import {
  VisualNode,
  NodeInstance,
  PinType,
  ConnectionData,
  noop,
  fullInsIdPath,
  EditorVisualNode,
  EditorNodeInstance,
} from "@flyde/core";

import { InstanceView } from "./instance-view/InstanceView";
import { ConnectionView } from "./connection-view/ConnectionView";
import { entries, Size } from "../utils";
import { useBoundingclientrect } from "rooks";
import { Button, Slider } from "../ui";

import {
  emptyObj,
  ViewPort,
  roundNumber,
  fitViewPortToNode,
  emptyList,
  animateViewPort,
} from "./utils";

import { NodeIoView } from "./node-io-view";
import { LayoutDebugger } from "./layout-debugger";
import { useDarkMode } from "../flow-editor/DarkModeContext";
import classNames from "classnames";
import useComponentSize from "@rehooks/component-size";
import { tempLoadingNode } from "./instance-view/loadingNode";

const defaultViewPort: ViewPort = {
  pos: { x: 0, y: 0 },
  zoom: 1,
};

// Create a single instance of common props to avoid recreating functions
const nodeIoViewNoopProps = {
  onDragStart: noop,
  onDragEnd: noop,
  onDragMove: noop,
  onSelect: noop,
  onMouseUp: noop,
  onMouseDown: noop,
  onSetDescription: noop,
  closest: false,
  connected: false,
  selected: false,
};

const instanceViewNoopProps = {
  onUngroup: noop,
  onPinClick: noop,
  onPinDblClick: noop,
  onDragStart: noop,
  onDragEnd: noop,
  onDragMove: noop,
  onDblClick: noop,
  onSelect: noop,
  onToggleSticky: noop,
  onInspectPin: noop,
  onTogglePinBreakpoint: noop,
  onTogglePinLog: noop,
  onChangeVisibleInputs: noop,
  onChangeVisibleOutputs: noop,
  onSetDisplayName: noop,
  onDeleteInstance: noop,
  onCloseInlineEditor: noop,
  onChangeStyle: noop,
  onGroupSelected: noop,
  onPinMouseDown: noop,
  onPinMouseUp: noop,
  onViewForkCode: noop,
  selected: false,
  dragged: false,
  isConnectedInstanceSelected: false,
  hadError: false,
  inlineEditorPortalDomNode: null,
};

const connectionViewNoopProps = {
  onDblClick: noop,
  toggleHidden: noop,
  removeConnection: noop,
  onSelectConnection: noop,
  selectedInstances: [],
  selectedConnections: [],
  draggedSource: null,
};

export type DiffStatus = "added" | "removed" | "changed" | undefined;

export interface VisualNodeDiffViewProps {
  node: EditorVisualNode;
  comparisonNode: EditorVisualNode;
  currentInsId: string;
  ancestorsInsIds?: string;
  className?: string;
  initialPadding?: [number, number];
}

// Add at the top with other types
type WithDiffStatus<T> = T & { diffStatus?: DiffStatus };

// const calculateInstanceDiff = (
//   instance: NodeInstance,
//   node: VisualNode,
//   comparisonNode?: VisualNode,
//   isFromComparison?: boolean
// ): DiffStatus => {
//   if (!comparisonNode) {
//     return undefined;
//   }

//   const currentInstance = isFromComparison ? instance : instance;
//   const otherInstance = (
//     isFromComparison ? node : comparisonNode
//   ).instances.find((i) => i.id === instance.id);

//   // Check if instance exists in both nodes
//   if (!otherInstance) {
//     return isFromComparison ? "added" : "removed";
//   }

//   // Compare relevant properties to detect changes
//   const relevantPropsToCompare = {
//     pos: currentInstance.pos,
//     inputConfig: currentInstance.inputConfig,
//     style: currentInstance.style,
//     displayName: currentInstance.displayName,
//     visibleInputs: currentInstance.visibleInputs,
//     visibleOutputs: currentInstance.visibleOutputs,
//   };

//   const otherRelevantProps = {
//     pos: otherInstance.pos,
//     inputConfig: otherInstance.inputConfig,
//     style: otherInstance.style,
//     displayName: otherInstance.displayName,
//     visibleInputs: otherInstance.visibleInputs,
//     visibleOutputs: otherInstance.visibleOutputs,
//   };

//   if (
//     JSON.stringify(relevantPropsToCompare) !==
//     JSON.stringify(otherRelevantProps)
//   ) {
//     return "changed";
//   }

//   return undefined;
// };

// const calculateConnectionDiff = (
//   connection: ConnectionData,
//   node: VisualNode,
//   comparisonNode?: VisualNode,
//   isFromComparison?: boolean
// ): DiffStatus => {
//   if (!comparisonNode) {
//     return undefined;
//   }

//   const currentConnection = isFromComparison ? connection : connection;
//   const otherConnections = isFromComparison
//     ? node.connections
//     : comparisonNode.connections;

//   const existsInOther = otherConnections.some(
//     (conn) =>
//       conn.from.insId === currentConnection.from.insId &&
//       conn.from.pinId === currentConnection.from.pinId &&
//       conn.to.insId === currentConnection.to.insId &&
//       conn.to.pinId === currentConnection.to.pinId
//   );

//   if (!existsInOther) {
//     return isFromComparison ? "added" : "removed";
//   }

//   return undefined;
// };

export const VisualNodeDiffView: React.FC<VisualNodeDiffViewProps> = (
  props
) => {
  const { node, comparisonNode, currentInsId, className, initialPadding } =
    props;

  const darkMode = useDarkMode();

  const [viewPort, setViewPort] = React.useState(defaultViewPort);
  const [didCenterInitially, setDidCenterInitially] = React.useState(false);

  const boardRef = React.useRef<HTMLDivElement>(null);
  const vpSize: Size = useComponentSize(boardRef);
  const boardPos = useBoundingclientrect(boardRef) || { x: 0, y: 0 };

  const { instances, connections } = node;

  const { inputs, outputs, inputsPosition, outputsPosition } = comparisonNode;

  const backgroundStyle: any = {
    backgroundPositionX: roundNumber(-viewPort.pos.x * viewPort.zoom),
    backgroundPositionY: roundNumber(-viewPort.pos.y * viewPort.zoom),
    backgroundSize: roundNumber(25 * viewPort.zoom) + "px",
  };

  const fitToScreen = React.useCallback(() => {
    const vp = fitViewPortToNode(node, vpSize);
    animateViewPort(viewPort, vp, 500, (vp) => {
      setViewPort(vp);
    });
  }, [node, vpSize, viewPort]);

  const onZoom = React.useCallback(
    (newZoom: number) => {
      setViewPort({ ...viewPort, zoom: newZoom });
    },
    [viewPort]
  );

  React.useEffect(() => {
    if (!didCenterInitially && vpSize.width) {
      const vp = fitViewPortToNode(comparisonNode, vpSize, initialPadding);
      setViewPort(vp);
      setDidCenterInitially(true);
    }
  }, [comparisonNode, initialPadding, vpSize, didCenterInitially]);

  const renderMainPins = (type: PinType) => {
    const pins = type === "input" ? inputs : outputs;
    const positionMap = type === "input" ? inputsPosition : outputsPosition;

    return entries(pins).map(([k, v]) => (
      <NodeIoView
        {...nodeIoViewNoopProps}
        currentInsId={currentInsId}
        ancestorInsIds={''}
        type={type}
        pos={positionMap[k] || { x: 0, y: 0 }}
        id={k}
        key={k}
        viewPort={viewPort}
        description={v.description ?? ''}
      />
    ));
  };

  const allInstancesToRender = React.useMemo(() => {
    // Start with all instances from the comparison node
    return comparisonNode.instances
      .map((compIns) => {
        // Find matching instance in current node
        const currentInstance = instances.find((ins) => ins.id === compIns.id);
        if (!currentInstance) {
          // Instance exists in comparison but not in current - it was added
          return {
            ...compIns,
            diffStatus: "added",
          } as WithDiffStatus<EditorNodeInstance>;
        }
        // Instance exists in both, check if it changed
        if (
          JSON.stringify({
            inputConfig: currentInstance.inputConfig,
            style: currentInstance.style,
            displayName: currentInstance.displayName,
            visibleInputs: currentInstance.visibleInputs,
            visibleOutputs: currentInstance.visibleOutputs,
          }) !==
          JSON.stringify({
            inputConfig: compIns.inputConfig,
            style: compIns.style,
            displayName: compIns.displayName,
            visibleInputs: compIns.visibleInputs,
            visibleOutputs: compIns.visibleOutputs,
          })
        ) {
          return {
            ...compIns, // Use comparison node's position
            inputConfig: currentInstance.inputConfig,
            style: currentInstance.style,
            displayName: currentInstance.displayName,
            visibleInputs: currentInstance.visibleInputs,
            visibleOutputs: currentInstance.visibleOutputs,
            diffStatus: "changed",
          } as WithDiffStatus<EditorNodeInstance>;
        }
        return { ...compIns } as WithDiffStatus<EditorNodeInstance>;
      })
      .concat(
        // Add instances that only exist in current node (they were removed)
        instances
          .filter(
            (ins) =>
              !comparisonNode.instances.find((compIns) => compIns.id === ins.id)
          )
          .map(
            (ins) =>
            ({
              ...ins,
              diffStatus: "removed",
            } as WithDiffStatus<EditorNodeInstance>)
          )
      );
  }, [instances, comparisonNode]);

  const connectionsToRender = React.useMemo(() => {
    // Start with all connections from comparison node
    const baseConnections = comparisonNode.connections.map((compConn) => {
      // Check if connection exists in current node
      const exists = connections.some(
        (conn) =>
          conn.from.insId === compConn.from.insId &&
          conn.from.pinId === compConn.from.pinId &&
          conn.to.insId === compConn.to.insId &&
          conn.to.pinId === compConn.to.pinId
      );
      // If it doesn't exist in current node, it was added
      return {
        ...compConn,
        diffStatus: exists ? undefined : "added",
      } as WithDiffStatus<ConnectionData>;
    });

    // Add connections that only exist in current node (they were removed)
    const removedConnections = connections
      .filter(
        (conn) =>
          !comparisonNode.connections.some(
            (compConn) =>
              compConn.from.insId === conn.from.insId &&
              compConn.from.pinId === conn.from.pinId &&
              compConn.to.insId === conn.to.insId &&
              compConn.to.pinId === conn.to.pinId
          )
      )
      .map(
        (conn) =>
          ({ ...conn, diffStatus: "removed" } as WithDiffStatus<ConnectionData>)
      );

    return [...baseConnections, ...removedConnections];
  }, [connections, comparisonNode]);

  return (
    <div
      className={classNames("visual-node-editor", "diff-view", className, {
        dark: darkMode,
      })}
      data-id={node.id}
    >
      <main
        className="board-editor-inner"
        ref={boardRef as any}
        style={backgroundStyle}
      >
        <React.Fragment>
          <LayoutDebugger
            vp={viewPort}
            node={node}
            extraDebug={emptyList}
            mousePos={{ x: 0, y: 0 }}
          />
        </React.Fragment>

        <ConnectionView
          {...connectionViewNoopProps}
          currentInsId={currentInsId}
          ancestorsInsIds={undefined}
          size={vpSize}
          node={node}
          boardPos={boardPos}
          instances={allInstancesToRender as EditorNodeInstance[]}
          connections={connectionsToRender}
          viewPort={viewPort}
          parentVp={defaultViewPort}
          lastMousePos={{ x: 0, y: 0 }}
        />

        {renderMainPins("input")}

        {allInstancesToRender.map((ins, idx) => (
          <InstanceView
            {...instanceViewNoopProps}
            connectionsPerInput={emptyObj}
            ancestorsInsIds={fullInsIdPath(currentInsId, props.ancestorsInsIds)}
            queuedInputsData={emptyObj}
            instance={ins}
            connections={connections}
            viewPort={viewPort}
            key={ins.id}
            diffStatus={ins.diffStatus}
          />
        ))}

        {renderMainPins("output")}

        <div className="viewport-controls-and-help">
          <Button variant="ghost" size="sm" onClick={fitToScreen}>
            Center
          </Button>
          <Slider
            min={0.15}
            max={3}
            step={0.05}
            className="w-[100px]"
            value={[viewPort.zoom]}
            onValueChange={([value]) => onZoom(value ?? 0)}
          />
        </div>
      </main>
    </div>
  );
};
