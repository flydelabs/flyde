import * as React from "react";

// ;
import {
  fullInsIdPath,
  getOutputName,
  InputMode,
  noop,
  PinType,
  Pos,
} from "@flyde/core";
import { BaseNodeView } from "../base-node-view";
import classNames from "classnames";
import { Menu, MenuItem, ContextMenu, Tooltip } from "@blueprintjs/core";
import { usePrompt } from "../../flow-editor/ports";
import { calcHistoryContent, useHistoryHelpers } from "../pin-view/helpers";
import { getInputName } from "@flyde/core";
import { getPinDomId } from "../dom-ids";
import { useDarkMode } from "../../flow-editor/DarkModeContext";

export interface NodeIoViewProps {
  id: string;
  type: PinType;
  pos: Pos;
  currentInsId: string;
  ancestorInsIds: string;
  connected: boolean;
  dragged?: boolean;
  inputMode?: InputMode;
  closest: boolean;
  viewPort: { pos: Pos; zoom: number };
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

  onSelect: (id: string, type: PinType) => void;
  selected: boolean;

  description: string;
  onSetDescription: (type: PinType, pin: string, description: string) => void;

  // onRequestHistory: (pinId: string, type: PinType) => Promise<HistoryPayload>;
}

export const NodeIoView: React.FC<NodeIoViewProps> = React.memo(
  function NodeIoViewInner(props) {
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
      description,
      onMouseUp,
      onMouseDown,
      currentInsId,
    } = props;

    const { history, resetHistory, refreshHistory } = useHistoryHelpers(
      currentInsId,
      id,
      type
    );

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
      props.onDragMove(type, id, event, { x: data.x, y: data.y });
    };

    const _prompt = usePrompt();

    const _onSetDescription = React.useCallback(async () => {
      const newDescription = await _prompt("Description?", description);
      onSetDescription(type, id, newDescription);
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
        { text: `Current mode - ${inputMode}`, onClick: noop },
        {
          text: "Make required",
          onClick: () => onChangeInputModeInner("required"),
        },
        {
          text: "Make optional",
          onClick: () => onChangeInputModeInner("optional"),
        },
        {
          text: "Make required-if-connected",
          onClick: () => onChangeInputModeInner("required-if-connected"),
        },
        {
          text: "Set description",
          onClick: _onSetDescription,
        },
        ...(props.onRename ? [{ text: "Rename", onClick: onRenameInner }] : []),
        ...(props.onDelete ? [{ text: "Delete", onClick: onDeleteInner }] : []),
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
          {contextMenuItems().map((item, key) => (
            <MenuItem {...item} key={key} />
          ))}
        </Menu>
      );
    }, [contextMenuItems]);

    // const showMenu = React.useCallback(
    //   (e: React.MouseEvent) => {
    //     e.preventDefault();
    //     e.stopPropagation();
    //     const menu = getContextMenu();
    //     ContextMenu.show(menu, { left: e.clientX, top: e.clientY });
    //   },
    //   [getContextMenu]
    // );

    const displayName = type === "input" ? getInputName(id) : getOutputName(id);

    const calcTooltipContent = () => {
      const historyContent = calcHistoryContent(history);

      const maybeDescription = props.description ? (
        <em>{props.description}</em>
      ) : (
        ""
      );

      return (
        <div>
          <div>
            <strong>{displayName}</strong> ({type}){" "}
          </div>
          {maybeDescription}
          <hr />
          {historyContent}
        </div>
      );
    };

    const _onMouseUp = React.useCallback(
      (e: React.MouseEvent) => {
        onMouseUp(id, type, e);
      },
      [id, onMouseUp, type]
    );

    const _onMouseDown = React.useCallback(
      (e: React.MouseEvent) => {
        onMouseDown(id, type, e);
      },
      [id, onMouseDown, type]
    );

    const dark = useDarkMode();

    return (
      <BaseNodeView
        className={classNames(`node-io-view`, type, { dark })}
        pos={pos}
        onDragEnd={onDragEnd}
        onDragStart={onDragStart}
        onDragMove={onDragMove}
        viewPort={viewPort}
      >
        <React.Fragment>
          <Tooltip content={calcTooltipContent()}>
            <ContextMenu
              onMouseEnter={refreshHistory}
              onMouseOut={resetHistory}
              onMouseUp={_onMouseUp}
              onMouseDown={_onMouseDown}
              data-tip=""
              data-html={true}
              data-for={id + props.currentInsId}
              className={classNames("node-io-view-inner", {
                closest,
                selected,
                dark,
              })}
              id={getPinDomId({
                fullInsIdPath: fullInsIdPath(
                  props.currentInsId,
                  props.ancestorInsIds
                ),
                pinId: id,
                pinType: type,
                isMain: true,
              })}
              onClick={_onClick}
              onDoubleClick={onDblClickInner}
              content={getContextMenu()}
            >
              {id}
            </ContextMenu>
          </Tooltip>
        </React.Fragment>
      </BaseNodeView>
    );
  }
);
