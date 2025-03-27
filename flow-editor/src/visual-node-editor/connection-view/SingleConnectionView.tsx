import * as React from "react";
import classNames from "classnames";
import { isInternalConnectionNode, ConnectionData } from "@flyde/core";
import { useSsr } from "usehooks-ts";
import {
  calcStartPos,
  calcTargetPos,
  unfoundPinPos,
} from "./calc-pin-position";
import { vDiv } from "../../physics";
import { ConnectionViewPath } from "./ConnectionViewPath/ConnectionViewPath";
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
  selectedInstances: string[];
}

export const SingleConnectionView: React.FC<SingleConnectionViewProps> = (
  props
) => {
  const { isBrowser } = useSsr();

  const {
    node,
    connection,
    instances,
    connectionType,
    viewPort,
    parentSelected,
    onSelectConnection,
    isConnectionSelected,
    onDelete,
    toggleHidden,
    selectedInstances,
  } = props;

  const [isHovered, setIsHovered] = React.useState(false);

  const { from, to } = connection;

  const fromInstance =
    isInternalConnectionNode(from) ?
    instances.find((i) => i.id === from.insId) :
    undefined;

  const toInstance =
    isInternalConnectionNode(to) && instances.find((i) => i.id === to.insId);

  const handleDelete = React.useCallback(() => {
    if (onDelete) {
      onDelete(connection);
    }
  }, [connection, onDelete]);

  const handleToggleHidden = React.useCallback(() => {
    toggleHidden(connection);
  }, [connection, toggleHidden]);

  if (!fromInstance && isInternalConnectionNode(from)) {
    console.warn(`Could not find instance ${from.insId} for connection`, from);
    return null;
  }

  const fromNode = fromInstance?.node ?? node;

  const sourcePin = fromNode.outputs[from.pinId];
  const delayed = sourcePin && sourcePin.delayed;

  const startPos = isBrowser
    ? calcStartPos({ ...props, connectionNode: from })
    : { x: 0, y: 0 };
  const endPos = isBrowser
    ? calcTargetPos({ ...props, connectionNode: connection.to })
    : { x: 0, y: 0 };

  if (startPos.x === unfoundPinPos.x && startPos.y === unfoundPinPos.y) {
    console.warn(
      `Could not find pin ${from.pinId} on instance ${from.insId} for connection`,
      from
    );
    return null;
  }

  if (endPos.x === unfoundPinPos.x && endPos.y === unfoundPinPos.y) {
    console.warn(
      `Could not find pin ${to.pinId} on instance ${to.insId} for connection`,
      to
    );
    return null;
  }

  const { x: x1, y: y1 } = vDiv(startPos, props.parentVp.zoom);
  const { x: x2, y: y2 } = vDiv(endPos, props.parentVp.zoom);

  const isInstanceSelected =
    (fromInstance && selectedInstances.includes(fromInstance.id)) ||
    (toInstance && selectedInstances.includes(toInstance.id));

  const connectionClassName = classNames(
    {
      delayed,
      hidden: connection.hidden && !isInstanceSelected,
      "parent-selected": parentSelected,
      selected: isConnectionSelected,
      "pending-selection": !isConnectionSelected && isHovered,
      added: (connection as any).diffStatus === "added",
      removed: (connection as any).diffStatus === "removed",
      changed: (connection as any).diffStatus === "changed",
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
      dashed={
        connectionType !== "regular" ||
        (connection.hidden && isInstanceSelected)
      }
      zoom={viewPort.zoom}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleConnectionPathClick}
      onDelete={handleDelete}
      onToggleHidden={handleToggleHidden}
    />
  );
};
