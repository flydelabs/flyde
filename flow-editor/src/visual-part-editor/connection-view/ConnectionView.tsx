import * as React from "react";
import classNames from "classnames";
import {
  VisualNode,
  Pos,
  NodesDefCollection,
  getNodeDef,
  NodeInstance,
  isInternalConnectionNode,
  ConnectionData,
  ConnectionNode,
} from "@flyde/core";
import { calcStartPos, calcTargetPos } from "./calc-pin-position";
import { Size } from "../../utils";
// ;

import { useSsr } from "usehooks-ts";
import { logicalPosToRenderedPos, ViewPort } from "../..";
import { vDiv } from "../../physics";
import { ContextMenu, Menu, MenuItem } from "@blueprintjs/core";
import { ConnectionViewPath } from "./ConnectionViewPath/ConnectionViewPath";

export interface BaseConnectionViewProps {
  resolvedNodes: NodesDefCollection;
  part: VisualNode;
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
  lastMousePos: Pos;
  draggedSource:
    | null
    | { from: ConnectionNode; to: undefined }
    | { to: ConnectionNode; from: undefined };
  toggleHidden: (connection: ConnectionData) => void;
  removeConnection: (connection: ConnectionData) => void;
}

export interface ConnectionItemViewProps extends BaseConnectionViewProps {
  connection: ConnectionData;
  type: "regular" | "future-add" | "future-remove";
  toggleHidden: (connection: ConnectionData) => void;
  removeConnection: (connection: ConnectionData) => void;
  parentSelected: boolean;
}

export const SingleConnectionView: React.FC<ConnectionItemViewProps> = (
  props
) => {
  const { isBrowser } = useSsr();

  const {
    connection,
    part,
    resolvedNodes,
    instances,
    type,
    viewPort,
    toggleHidden,
    parentSelected,
    removeConnection,
  } = props;
  const { from } = connection;

  const fromInstance =
    isInternalConnectionNode(from) &&
    instances.find((i) => i.id === from.insId);

  if (!fromInstance && isInternalConnectionNode(from)) {
    throw new Error(
      `impossible state  - "from instance id - [${from.insId}] does not exist"`
    );
  }

  const fromNode =
    isInternalConnectionNode(from) && fromInstance
      ? getNodeDef(fromInstance, resolvedNodes)
      : part;

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
    { delayed, hidden: connection.hidden, "parent-selected": parentSelected },
    type
  );

  const showMenu = React.useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      const menu = (
        <Menu>
          <MenuItem
            text={connection.hidden ? "Show connection" : "Hide connection"}
            onClick={() => toggleHidden(connection)}
          />
          <MenuItem
            text="Remove connection"
            onClick={() => removeConnection(connection)}
          />
        </Menu>
      );
      ContextMenu.show(menu, { left: e.pageX, top: e.pageY });
    },
    [connection, removeConnection, toggleHidden]
  );

  return (
    <ConnectionViewPath
      className={cm}
      from={{ x: x1, y: y1 }}
      to={{ x: x2, y: y2 }}
      dashed={type !== "regular"}
      zoom={viewPort.zoom}
      onContextMenu={showMenu}
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
    const parentSelected =
      selectedInstances.includes(conn.from.insId) ||
      selectedInstances.includes(conn.to.insId);
    return (
      <SingleConnectionView
        {...props}
        connection={conn}
        type="regular"
        parentSelected={parentSelected}
        key={conn.from.insId + conn.from.pinId + conn.to.insId + conn.to.pinId}
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
    <span className={"connections-view"} style={{ opacity: viewPort.zoom }}>
      <svg style={{ width: "100%" }}>{connectionPaths}</svg>
    </span>
  );
};
