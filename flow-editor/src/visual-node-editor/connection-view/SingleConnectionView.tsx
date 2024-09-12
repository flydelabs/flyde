import * as React from "react";
import classNames from "classnames";
import { isInternalConnectionNode, ConnectionData } from "@flyde/core";
import { useSsr } from "usehooks-ts";
import { calcStartPos, calcTargetPos } from "./calc-pin-position";
import { vDiv } from "../../physics";
import { ConnectionViewPath } from "./ConnectionViewPath/ConnectionViewPath";
import { safelyGetNodeDef } from "../../flow-editor/getNodeDef";
import { BaseConnectionViewProps } from "./ConnectionView";

export interface SingleConnectionViewProps extends BaseConnectionViewProps {
  connection: ConnectionData;
  connectionType: "regular" | "future-add" | "future-remove";
  toggleHidden: (connection: ConnectionData) => void;
  removeConnection: (connection: ConnectionData) => void;
  parentSelected: boolean;
  onSelectConnection: (
    connectionData: ConnectionData,
    ev: React.MouseEvent
  ) => void;
  isConnectionSelected?: boolean;
  onDelete?: (connection: ConnectionData) => void;
}

export const SingleConnectionView: React.FC<SingleConnectionViewProps> = (
  props
) => {
  const { isBrowser } = useSsr();

  const {
    connection,
    node,
    resolvedNodes,
    instances,
    connectionType,
    viewPort,
    parentSelected,
    onSelectConnection,
    isConnectionSelected,
    onDelete,
  } = props;

  const [isHovered, setIsHovered] = React.useState(false);

  const { from } = connection;

  const fromInstance =
    isInternalConnectionNode(from) &&
    instances.find((i) => i.id === from.insId);

  const handleDelete = React.useCallback(() => {
    if (onDelete) {
      onDelete(connection);
    }
  }, [connection, onDelete]);

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

  const connectionClassName = classNames(
    {
      delayed,
      hidden: connection.hidden,
      "parent-selected": parentSelected,
      selected: isConnectionSelected,
      "pending-selection": !isConnectionSelected && isHovered,
    },
    connectionType
  );

  const handleConnectionPathClick = (e: React.MouseEvent) => {
    onSelectConnection(connection, e);
  };

  return (
    <ConnectionViewPath
      className={connectionClassName}
      from={{ x: x1, y: y1 }}
      to={{ x: x2, y: y2 }}
      dashed={connectionType !== "regular"}
      zoom={viewPort.zoom}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleConnectionPathClick}
      onDelete={handleDelete}
    />
  );
};
