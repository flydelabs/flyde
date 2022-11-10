/* eslint-disable @typescript-eslint/no-unused-vars */
import * as React from "react";
import classNames from "classnames";
import Draggable from "react-draggable";

// ;
import { Pos } from "@flyde/core";

// export const PIECE_HORIZONTAL_PADDING = 25;
// export const PIECE_CHAR_WIDTH = 11;
// export const MIN_WIDTH_PER_PIN = 40;

import { IMenuItemProps } from "@blueprintjs/core";


export interface BasePartViewContextItem { 
  label: string; callback: any
}

export interface BasePartViewProps {
  domId?: string;
  className?: string;
  pos: Pos;
  dragged?: boolean;
  viewPort: { pos: Pos; zoom: number };

  displayMode?: true;

  upperRenderer?: () => any;
  bottomRenderer?: () => any;

  onDragEnd: (...data: any[]) => void;
  onDragStart: (...data: any[]) => void;
  onDragMove: (ev: React.MouseEvent, pos: Pos) => void;
}

export const BasePartView: React.FC<BasePartViewProps> = function BasePartViewInner(props) {
  const {
    dragged,
    viewPort,
    pos,
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
          <div className={cm} style={zoomFixStyle} id={props.domId}>
            {props.children}
          </div>
        </span>
      </Draggable>
    </div>
  );
};
