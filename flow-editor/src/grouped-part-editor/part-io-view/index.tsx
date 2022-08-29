import * as React from "react";

// ;
import { InputMode, noop, Pos } from "@flyde/core";
import { BasePartView } from "../base-part-view";
import { getMainPinDomId } from "../dom-ids";
import classNames from "classnames";

export type PartIoType = "input" | "output";

interface PartIoViewProps {
  id: string;
  type: PartIoType;
  pos: Pos;
  insId: string;
  connected: boolean;
  dragged?: boolean;
  inputMode?: InputMode;
  closest: boolean;
  viewPort: { pos: Pos; zoom: number };
  pinType: string;
  onDblClick?: (pinId: string, e: React.MouseEvent) => void;
  onDelete?: (type: PartIoType, pin: string) => void;
  onRename?: (type: PartIoType, pin: string) => void;
  onChangeInputMode?: (pin: string, newMode: InputMode) => void;
  onChange?: (type: PartIoType, pin: string) => void;
  onDragEnd: (type: PartIoType, pin: string, ...data: any[]) => void;
  onDragStart: (pin: string, ...data: any[]) => void;
  onDragMove: (type: PartIoType, pin: string, ...data: any[]) => void;

  onSelect: (id: string, type: PartIoType) => void;
  selected: boolean;
}

export const PartIoView: React.SFC<PartIoViewProps> = React.memo(function PartIoViewInner(props) {
  const {
    viewPort,
    selected,
    pos,
    type,
    id,
    onDblClick,
    onRename,
    onDelete,
    onChangeInputMode,
    inputMode,
    onSelect,
    closest,
  } = props;

  const onDragStart = (event: any, data: any) => {
    props.onDragStart(id, event, data);
  };

  const onDragEnd = (event: any, data: any) => {
    const currPos = props.pos;
    const dx = (data.x - currPos.x) / viewPort.zoom;
    const dy = (data.y - currPos.y) / viewPort.zoom;
    const newX = currPos.x + dx;
    const newY = currPos.y + dy;
    props.onDragEnd(type, id, event, { ...data, x: newX, y: newY });
  };

  const onDragMove = (event: any, data: any) => {
    const currPos = props.pos;
    const dx = (data.x - currPos.x) / viewPort.zoom;
    const dy = (data.y - currPos.y) / viewPort.zoom;
    const newX = currPos.x + dx;
    const newY = currPos.y + dy;
    props.onDragMove(type, id, event, { ...data, x: newX, y: newY });
  };

  const onDeleteInner = React.useCallback(() => {
    if (onDelete) {
      onDelete(type, id);
    }
  }, [type, id, onDelete]);

  const onRenameInner = React.useCallback(() => {
    if (onRename) {
      onRename(type, id);
    }
  }, [type, id, onRename]);

  const onChangeInputModeInner = React.useCallback(
    (mode: InputMode) => {
      if (onChangeInputMode) {
        onChangeInputMode(id, mode);
      }
    },
    [id, onChangeInputMode]
  );

  const contextMenuItems = () => {
    return [
      { label: `Current mode - ${inputMode}`, callback: noop },
      { label: "Make required", callback: () => onChangeInputModeInner("required") },
      { label: "Make optional", callback: () => onChangeInputModeInner("optional") },
      {
        label: "Make required-if-connected",
        callback: () => onChangeInputModeInner("required-if-connected"),
      },
      ...(props.onRename ? [{ label: "Rename", callback: onRenameInner }] : []),
      ...(props.onDelete ? [{ label: "Delete", callback: onDeleteInner }] : []),
    ];
  };

  const onDblClickInner = React.useCallback(
    (e: any) => {
      if (onDblClick) {
        onDblClick(props.id, e);
      }
    },
    [onDblClick, props.id]
  );

  const _onClick = React.useCallback(() => {
    onSelect(id, type);
  }, [id, type, onSelect]);

  return (
    <BasePartView
      className={classNames(`part-io-view`, type, { closest })}
      domId={getMainPinDomId(props.insId, id, type)}
      pos={pos}
      onDragEnd={onDragEnd}
      onDragStart={onDragStart}
      onDragMove={onDragMove}
      onClick={_onClick}
      label={id}
      viewPort={viewPort}
      contextMenuItems={contextMenuItems()}
      onDoubleClick={onDblClickInner}
      selected={selected}
    />
  );
});
