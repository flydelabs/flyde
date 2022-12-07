import * as React from "react";

// ;
import { InputMode, noop, Pos } from "@flyde/core";
import { BasePartView } from "../base-part-view";
import { getMainPinDomId } from "../dom-ids";
import classNames from "classnames";
import { Menu, MenuItem, ContextMenu } from "@blueprintjs/core";
import { usePrompt } from "../../flow-editor/ports";

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

  description: string;
  onSetDescription: (type: PartIoType, pin: string, description: string) => void;
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
    onSetDescription,
    description
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

  const _prompt = usePrompt()

  const _onSetDescription = React.useCallback(async () => {
    const newDescription = await _prompt('Description?', description)
    onSetDescription(type, id, newDescription);
  }, [_prompt, description, onSetDescription, type, id])

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

  const contextMenuItems = React.useCallback(() => {
    return [
      { text: `Current mode - ${inputMode}`, onClick: noop },
      { text: "Make required", onClick: () => onChangeInputModeInner("required") },
      { text: "Make optional", onClick: () => onChangeInputModeInner("optional") },
      {
        text: "Make required-if-connected",
        onClick: () => onChangeInputModeInner("required-if-connected"),
      },
      {
        text: 'Set description',
        onClick: _onSetDescription
      },
      ...(props.onRename ? [{ text: "Rename", onClick: onRenameInner }] : []),
      ...(props.onDelete ? [{ text: "Delete", onClick: onDeleteInner }] : []),
    ];
  }, [inputMode, onChangeInputModeInner, onDeleteInner, onRenameInner, props.onDelete, props.onRename]);

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

  const getContextMenu = React.useCallback(() => {
    return (
      <Menu>
        {contextMenuItems().map((item) => (
          <MenuItem {...item} />
        ))}
      </Menu>
    );
  }, [contextMenuItems]);

  const showMenu = React.useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      const menu = getContextMenu();
      ContextMenu.show(menu, { left: e.clientX, top: e.clientY });
    },
    [getContextMenu]
  );

  return (
    <BasePartView
      className={classNames(`part-io-view`, type)}
      pos={pos}
      onDragEnd={onDragEnd}
      onDragStart={onDragStart}
      onDragMove={onDragMove}
      viewPort={viewPort}
    >
        <div
            className={classNames('part-io-view-inner', { closest, selected })}
            id={getMainPinDomId(props.insId, id, type)}
            onClick={_onClick}
            onDoubleClick={onDblClickInner}
            onContextMenu={showMenu}
        >{id}</div>
      </BasePartView>
  );
});
