import * as React from "react";
import classNames from "classnames";
import {
  VisualNode,
  Pos,
  NodesDefCollection,
  NodeInstance,
  isInternalConnectionNode,
  ConnectionData,
  ConnectionNode,
} from "@flyde/core";
import { calcStartPos, calcTargetPos } from "./calc-pin-position";
import { Size } from "../../utils";

import { useSsr } from "usehooks-ts";
import { getConnectionId, logicalPosToRenderedPos, ViewPort } from "../..";
import { vDiv } from "../../physics";
import { ConnectionViewPath } from "./ConnectionViewPath/ConnectionViewPath";
import { safelyGetNodeDef } from "../../flow-editor/getNodeDef";

export interface BaseConnectionViewProps {
  resolvedNodes: NodesDefCollection;
  node: VisualNode;
  ancestorsInsIds?: string;
  currentInsId: string;
  onDblClick: () => void;
  size: Size;
  boardPos: Pos;
  viewPort: ViewPort;
  instances: NodeInstance[];
  parentVp: ViewPort;
}

export interface ConnectionViewProps extends BaseConnectionViewProps {
  connections: ConnectionData[];
  futureConnection?: {
    connection: ConnectionData;
    type: "future-add" | "future-remove";
  };
  selectedInstances: string[];
  selectedConnections: string[];
  lastMousePos: Pos;
  draggedSource:
    | null
    | { from: ConnectionNode; to: undefined }
    | { to: ConnectionNode; from: undefined };
  toggleHidden: (connection: ConnectionData) => void;
  removeConnection: (connection: ConnectionData) => void;
  onSelectConnection: (
    connectionData: ConnectionData,
    ev: React.MouseEvent
  ) => void;
}

export interface ConnectionItemViewProps extends BaseConnectionViewProps {
  connection: ConnectionData;
  type: "regular" | "future-add" | "future-remove";
  toggleHidden: (connection: ConnectionData) => void;
  removeConnection: (connection: ConnectionData) => void;
  parentSelected: boolean;
  onSelectConnection: (
    connectionData: ConnectionData,
    ev: React.MouseEvent
  ) => void;
  isConnectionSelected?: boolean;
}

export const SingleConnectionView: React.FC<ConnectionItemViewProps> = (
  props
) => {
  const { isBrowser } = useSsr();

  const {
    connection,
    node,
    resolvedNodes,
    instances,
    type,
    viewPort,
    toggleHidden,
    parentSelected,
    removeConnection,
    onSelectConnection,
    isConnectionSelected,
  } = props;

  const [isPendingSelection, setIsPendingSelection] = React.useState(false);

  const { from } = connection;

  const fromInstance =
    isInternalConnectionNode(from) &&
    instances.find((i) => i.id === from.insId);

  if (!fromInstance && isInternalConnectionNode(from)) {
    console.warn(`Could not find instance ${from.insId} for connection`, from);
    return null;
  }

  const fromNode =
    isInternalConnectionNode(from) && fromInstance
      ? safelyGetNodeDef(fromInstance, resolvedNodes)
      : node;

  const sourcePin = fromNode.outputs[from.pinId];
  const delayed = sourcePin && sourcePin.delayed;

  const startPos = isBrowser
    ? calcStartPos({ ...props, connectionNode: from })
    : { x: 0, y: 0 };
  const endPos = isBrowser
    ? calcTargetPos({ ...props, connectionNode: connection.to })
    : { x: 0, y: 0 };

  const { x: x1, y: y1 } = vDiv(startPos, props.parentVp.zoom);
  const { x: x2, y: y2 } = vDiv(endPos, props.parentVp.zoom);

  const cm = classNames(
    {
      delayed,
      hidden: connection.hidden,
      "parent-selected": parentSelected,
      selected: isConnectionSelected,
      "pending-selection": !isConnectionSelected && isPendingSelection,
    },
    type
  );

  const onConnectionPathClick = (e: React.MouseEvent) => {
    onSelectConnection(connection, e);
  };

  return (
    <ConnectionViewPath
      className={cm}
      from={{ x: x1, y: y1 }}
      to={{ x: x2, y: y2 }}
      dashed={type !== "regular"}
      zoom={viewPort.zoom}
      onMouseProximity={setIsPendingSelection}
      onClick={onConnectionPathClick}
    />
  );
};

export const ConnectionView: React.FC<ConnectionViewProps> = (props) => {
  const {
    viewPort,
    futureConnection,
    toggleHidden,
    selectedInstances,
    draggedSource,
    selectedConnections,
    onSelectConnection,
  } = props;

  const [renderTrigger, setRenderTrigger] = React.useState(0);

  const requestRerender = React.useCallback((count: number) => {
    return requestAnimationFrame(() => {
      setRenderTrigger((r) => (r + 1) % 9);
      if (count > 0) {
        requestRerender(count - 1);
      }
    });
  }, []);

  React.useEffect(() => {
    // re-render 10 times and then stop
    // this is a very ugly hack to make connections render smoothly
    // but for some reason, if this is always on (As in no limit), when the playground
    // is scrolled, connections are rendered wrong

    const t = requestRerender(10);

    return () => {
      cancelAnimationFrame(t);
    };
  }, [requestRerender]);

  React.useEffect(() => {
    const handler = () => {
      requestRerender(3);
    };
    window.addEventListener("scroll", handler);
    window.addEventListener("resize", handler);

    return () => {
      window.removeEventListener("scroll", handler);
      window.removeEventListener("resize", handler);
    };
  }, [requestRerender, renderTrigger]);

  const connectionPaths = props.connections.map((conn) => {
    const connectionId = getConnectionId(conn);
    const parentSelected =
      selectedInstances.includes(conn.from.insId) ||
      selectedInstances.includes(conn.to.insId);
    return (
      <SingleConnectionView
        {...props}
        connection={conn}
        type="regular"
        parentSelected={parentSelected}
        onSelectConnection={onSelectConnection}
        isConnectionSelected={selectedConnections.includes(connectionId)}
        key={connectionId}
      />
    );
  });

  if (futureConnection) {
    connectionPaths.push(
      <SingleConnectionView
        {...props}
        connection={futureConnection.connection}
        type={futureConnection.type}
        toggleHidden={toggleHidden}
        parentSelected={false}
        onSelectConnection={onSelectConnection}
        key={"future"}
      />
    );
  }

  if (draggedSource) {
    const fn = draggedSource.from ? calcStartPos : calcTargetPos;
    const pos = fn({
      connectionNode: draggedSource.from ?? draggedSource.to,
      viewPort,
      boardPos: props.boardPos,
      ancestorsInsIds: props.ancestorsInsIds,
      currentInsId: props.currentInsId,
    });

    connectionPaths.push(
      <ConnectionViewPath
        className="dragged"
        from={pos}
        to={logicalPosToRenderedPos(props.lastMousePos, viewPort)}
        zoom={viewPort.zoom}
        key={"dragged"}
      />
    );
  }

  return (
    // <span className="connections-view" style={{ opacity: viewPort.zoom }}>
    <svg className="connections-view">{connectionPaths}</svg>
    // </span>
  );
};
