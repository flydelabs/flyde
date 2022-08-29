import * as React from "react";
import classNames from "classnames";
import Draggable from "react-draggable";

// ;
import { Pos } from "@flyde/core";

// export const PIECE_HORIZONTAL_PADDING = 25;
// export const PIECE_CHAR_WIDTH = 11;
// export const MIN_WIDTH_PER_PIN = 40;

import { ContextMenu, Menu, MenuItem } from "@blueprintjs/core";
import { PosDebugger } from "../layout-debugger";

export interface BasePartViewProps {
  domId?: string;
  className?: string;
  label: string;
  pos: Pos;
  selected?: boolean;
  dragged?: boolean;
  viewPort: { pos: Pos; zoom: number };

  contextMenuItems: Array<{ label: string; callback: any }>;

  displayMode?: true;

  upperRenderer?: () => any;
  bottomRenderer?: () => any;

  onClick: (e: React.MouseEvent) => void;
  onDoubleClick: (e: React.MouseEvent) => void;
  onDragEnd: (...data: any[]) => void;
  onDragStart: (...data: any[]) => void;
  onDragMove: (ev: React.MouseEvent, pos: Pos) => void;
}

export const BasePartView: React.FC<BasePartViewProps> = function BasePartViewInner(props) {
  const {
    selected,
    dragged,
    label,
    viewPort,
    pos,
    onClick,
    onDoubleClick,
    onDragEnd,
    onDragMove,
    onDragStart,
    displayMode,
  } = props;

  const _onDragStart = React.useCallback(
    (event: any, data: any) => {
      onDragStart(event, data);
    },
    [onDragStart]
  );

  const _onDragEnd = React.useCallback(
    (event: any, data: any) => {
      const currPos = pos;
      const dx = (data.x - currPos.x) / viewPort.zoom;
      const dy = (data.y - currPos.y) / viewPort.zoom;
      const newX = currPos.x + dx;
      const newY = currPos.y + dy;
      onDragEnd(event, { ...data, x: newX, y: newY });
    },
    [pos, onDragEnd, viewPort]
  );

  const _onDragMove = React.useCallback(
    (event: any, data: any) => {
      onDragMove(event, { x: data.x, y: data.y });
    },
    [onDragMove]
  );

  const zoomFixStyle = {
    transform: `scale(${viewPort.zoom})`,
  };

  const cm = classNames("base-part-view", props.className, {
    selected,
    dragged,
    "display-mode": displayMode,
  });

  const correctX = pos.x * viewPort.zoom - viewPort.pos.x * viewPort.zoom;
  const correctY = pos.y * viewPort.zoom - viewPort.pos.y * viewPort.zoom;

  const dx = correctX - pos.x;
  const dy = correctY - pos.y;

  const fixerStyle: any = {
    transform: `translate(${dx}px, ${dy}px)`,
  };
  const getContextMenu = React.useCallback(() => {
    return (
      <Menu>
        {props.contextMenuItems.map((item) => (
          <MenuItem onClick={item.callback} label={item.label} key={item.label} />
        ))}
      </Menu>
    );
  }, [props.contextMenuItems]);

  const showMenu = React.useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      const menu = getContextMenu();
      ContextMenu.show(menu, { left: e.pageX, top: e.pageY });
    },
    [getContextMenu]
  );

  const upperElement = props.upperRenderer ? props.upperRenderer() : null;
  const bottomElement = props.bottomRenderer ? props.bottomRenderer() : null;

  const outerCm = classNames("base-part-view-vp-fixer", { "display-mode": displayMode });

  return (
    <div className={outerCm} style={fixerStyle}>
      <Draggable
        onStop={_onDragEnd}
        onStart={_onDragStart}
        onDrag={_onDragMove}
        position={pos}
        cancel=".no-drag"
      >
        <span className="base-part-view-wrapper">
          <PosDebugger pos={pos} />
          <div className={cm} style={zoomFixStyle} id={props.domId}>
            {upperElement}
            <div
              className="base-part-view-inner"
              onClick={onClick}
              onDoubleClick={onDoubleClick}
              onContextMenu={showMenu}
            >
              {label}
            </div>
            {bottomElement}
          </div>
        </span>
      </Draggable>
    </div>
  );
};
