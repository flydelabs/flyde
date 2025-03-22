import * as React from "react";
import {
  Pos,
  ConnectionData,
  ConnectionNode,
  EditorVisualNode,
  EditorNodeInstance,
} from "@flyde/core";
import { Size } from "../../utils";
import { getConnectionId, logicalPosToRenderedPos, ViewPort } from "../..";
import { ConnectionViewPath } from "./ConnectionViewPath/ConnectionViewPath";
import { SingleConnectionView } from "./SingleConnectionView";
import { calcStartPos, calcTargetPos } from "./calc-pin-position";

export interface BaseConnectionViewProps {
  node: EditorVisualNode;
  ancestorsInsIds?: string;
  currentInsId: string;
  onDblClick: () => void;
  size: Size;
  boardPos: Pos;
  viewPort: ViewPort;
  instances: EditorNodeInstance[];
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

export const ConnectionView: React.FC<ConnectionViewProps> = (props) => {
  const {
    viewPort,
    futureConnection,
    selectedInstances,
    draggedSource,
    selectedConnections,
    onSelectConnection,
    removeConnection,
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
        connectionType="regular"
        parentSelected={parentSelected}
        onSelectConnection={onSelectConnection}
        isConnectionSelected={selectedConnections.includes(connectionId)}
        key={connectionId}
        onDelete={removeConnection}
      />
    );
  });

  if (futureConnection) {
    connectionPaths.push(
      <SingleConnectionView
        {...props}
        connection={futureConnection.connection}
        connectionType={futureConnection.type}
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
        dashed={true}
        key={"dragged"}
      />
    );
  }

  return <svg className="connections-view">{connectionPaths}</svg>;
};
