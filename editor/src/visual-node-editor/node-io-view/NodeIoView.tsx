import * as React from "react";
import { InputMode, noop, PinType, Pos } from "@flyde/core";
import { BaseNodeView } from "../base-node-view";
import classNames from "classnames";
import { usePrompt } from "../../flow-editor/ports";
import { getInputName, getOutputName } from "../pin-view/helpers";
import { useDarkMode } from "../../flow-editor/DarkModeContext";
import { PinView } from "../pin-view/PinView";
import { getMainPinDomId } from "../dom-ids";

import {
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
} from "../../ui";

export interface NodeIoViewProps {
  id: string;
  type: PinType;
  pos: Pos;
  currentInsId: string;
  ancestorInsIds?: string;
  connected: boolean;
  dragged?: boolean;
  inputMode?: InputMode;
  closest: boolean;
  viewPort: { pos: Pos; zoom: number };
  increasedDropArea?: boolean;
  onDblClick?: (pinId: string, e: React.MouseEvent) => void;
  onDelete?: (type: PinType, pin: string) => void;
  onRename?: (type: PinType, pin: string) => void;
  onChangeInputMode?: (pin: string, newMode: InputMode) => void;
  onChange?: (type: PinType, pin: string) => void;
  onDragEnd: (type: PinType, pin: string, ...data: any[]) => void;
  onDragStart: (pin: string, ...data: any[]) => void;
  onDragMove: (type: PinType, pin: string, ...data: any[]) => void;

  onMouseUp: (id: string, type: PinType, e: React.MouseEvent) => void;
  onMouseDown: (id: string, type: PinType, e: React.MouseEvent) => void;

  onSelect: (id: string, type: PinType, event?: React.MouseEvent) => void;
  selected: boolean;

  description: string;
  onSetDescription: (type: PinType, pin: string, description: string) => void;
}

export const NodeIoView: React.FC<NodeIoViewProps> = React.memo(
  function NodeIoViewInner(props) {
    const {
      viewPort,
      selected,
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
      description,
      onMouseUp,
      onMouseDown,
      currentInsId,
      onDragStart,
      onDragEnd,
      pos,
    } = props;

    const lastDragEndTimeRef = React.useRef<number>(0);

    const _onDragStart = React.useCallback(
      (event: any, data: any) => {
        onDragStart(id, event, data);
      },
      [id, onDragStart]
    );

    const _onDragEnd = React.useCallback(
      (event: any, data: any) => {
        const currPos = pos;
        const dx = (data.x - currPos.x) / viewPort.zoom;
        const dy = (data.y - currPos.y) / viewPort.zoom;
        const newX = currPos.x + dx;
        const newY = currPos.y + dy;

        const pixelsMoved = Math.abs(dx) + Math.abs(dy);

        onDragEnd(type, id, event, { ...data, x: newX, y: newY });
        if (pixelsMoved > 0) {
          lastDragEndTimeRef.current = Date.now();
        }
      },
      [pos, viewPort.zoom, onDragEnd, type, id]
    );

    const onDragMove = (event: any, data: any) => {
      props.onDragMove(type, id, event, { x: data.x, y: data.y });
    };

    const _prompt = usePrompt();

    const _onSetDescription = React.useCallback(async () => {
      const newDescription = await _prompt("Description?", description);
      onSetDescription(type, id, newDescription ?? "");
    }, [_prompt, description, onSetDescription, type, id]);

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
        <ContextMenuItem key="mode" disabled>
          Current mode - {inputMode}
        </ContextMenuItem>,
        <ContextMenuSeparator key="sep1" />,
        <ContextMenuItem
          key="required"
          onClick={() => onChangeInputModeInner("required")}
        >
          Make required
        </ContextMenuItem>,
        <ContextMenuItem
          key="optional"
          onClick={() => onChangeInputModeInner("optional")}
        >
          Make optional
        </ContextMenuItem>,
        <ContextMenuItem
          key="required-if-connected"
          onClick={() => onChangeInputModeInner("required-if-connected")}
        >
          Make required-if-connected
        </ContextMenuItem>,
        <ContextMenuSeparator key="sep2" />,
        <ContextMenuItem key="description" onClick={_onSetDescription}>
          Set description
        </ContextMenuItem>,
        ...(props.onRename
          ? [
            <ContextMenuItem key="rename" onClick={onRenameInner}>
              Rename
            </ContextMenuItem>,
          ]
          : []),
        ...(props.onDelete
          ? [
            <ContextMenuItem
              key="delete"
              className="text-red-500"
              onClick={onDeleteInner}
            >
              Delete
            </ContextMenuItem>,
          ]
          : []),
      ];
    }, [
      _onSetDescription,
      inputMode,
      onChangeInputModeInner,
      onDeleteInner,
      onRenameInner,
      props.onDelete,
      props.onRename,
    ]);

    const getContextMenu = React.useCallback(() => {
      return <ContextMenuContent>{contextMenuItems()}</ContextMenuContent>;
    }, [contextMenuItems]);

    const onDblClickInner = React.useCallback(
      (e: any) => {
        if (onDblClick) {
          onDblClick(props.id, e);
        }
      },
      [onDblClick, props.id]
    );

    const _onClick = React.useCallback((e: React.MouseEvent) => {
      if (Date.now() - lastDragEndTimeRef.current > 200) {
        onSelect(id, type, e);
      }
    }, [id, type, onSelect]);

    const displayName = type === "input" ? getInputName(id) : getOutputName(id);

    const _onMouseUp = React.useCallback(
      (e: React.MouseEvent) => {
        const reversedType = type === "input" ? "output" : "input";
        onMouseUp(id, reversedType, e);
      },
      [id, onMouseUp, type]
    );

    const _onMouseDown = React.useCallback(
      (e: React.MouseEvent) => {
        const reversedType = type === "input" ? "output" : "input";
        onMouseDown(id, reversedType, e);
      },
      [id, onMouseDown, type]
    );

    const dark = useDarkMode();

    const pinContent = (
      <div className={classNames("pin-container", type)}>
        {type === "input" ? (
          <PinView
            type="output"
            currentInsId={currentInsId}
            ancestorsInsIds={props.ancestorInsIds}
            id={id}
            connected={props.connected}
            isClosestToMouse={closest}
            selected={selected}
            onClick={(pinId, pinType, e) => onSelect(pinId, pinType, e)}
            onDoubleClick={(pinId, e) => onDblClick && onDblClick(pinId, e)}
            onToggleLogged={noop}
            onToggleBreakpoint={noop}
            onInspect={noop}
            description={description}
            increasedDropArea={props.increasedDropArea}
            onMouseUp={(pinId, pinType, e) => {
              e.stopPropagation();
              _onMouseUp(e);
            }}
            onMouseDown={(pinId, pinType, e) => {
              e.stopPropagation();
              _onMouseDown(e);
            }}
            isMain={true}
          />
        ) : (
          <PinView
            type="input"
            currentInsId={currentInsId}
            ancestorsInsIds={props.ancestorInsIds}
            id={id}
            connected={props.connected}
            isClosestToMouse={closest}
            selected={selected}
            onClick={(pinId, pinType) => onSelect(pinId, pinType)}
            onDoubleClick={(pinId, e) => onDblClick && onDblClick(pinId, e)}
            onToggleLogged={noop}
            onToggleBreakpoint={noop}
            onInspect={noop}
            description={description}
            increasedDropArea={props.increasedDropArea}
            onMouseUp={(pinId, pinType, e) => {
              e.stopPropagation();
              _onMouseUp(e);
            }}
            onMouseDown={(pinId, pinType, e) => {
              e.stopPropagation();
              _onMouseDown(e);
            }}
            onToggleSticky={noop}
            isSticky={false}
            queuedValues={0}
            isMain={true}
          />
        )}
      </div>
    );

    const domId = getMainPinDomId(currentInsId, id, type);
    return (
      <BaseNodeView
        className={classNames(`node-io-view`, type, { dark })}
        pos={pos}
        icon={"arrow-right-long"}
        description={description ?? `Main ${type} pin - ${id}`}
        onDragEnd={_onDragEnd}
        onDragStart={_onDragStart}
        onDragMove={onDragMove}
        viewPort={viewPort}
        heading={displayName}
        leftSide={type === "output" ? pinContent : undefined}
        rightSide={type === "input" ? pinContent : undefined}
        contextMenuContent={getContextMenu()}
        onClick={_onClick}
        onDoubleClick={onDblClickInner}
        selected={selected}
        dark={dark}
        domId={domId}
      />
    );
  }
);
