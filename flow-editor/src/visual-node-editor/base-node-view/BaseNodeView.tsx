/* eslint-disable @typescript-eslint/no-unused-vars */
import * as React from "react";
import classNames from "classnames";
import Draggable from "react-draggable";

// ;
import { Pos } from "@flyde/core";

import { useDarkMode } from "../../flow-editor/DarkModeContext";

export interface BaseNodeViewContextItem {
  label: string;
  callback: any;
}

export interface BaseNodeViewProps {
  children: JSX.Element;
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

export const BaseNodeView: React.FC<BaseNodeViewProps> =
  function BaseNodeViewInner(props) {
    const {
      dragged,
      viewPort,
      pos,
      onDragEnd,
      onDragMove,
      onDragStart,
      displayMode,
    } = props;

    const dark = useDarkMode();

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
      (event: any, { x, y }: { x: number; y: number }) => {
        onDragMove(event, { x, y });
      },
      [onDragMove]
    );

    const zoomFixStyle = {
      transform: `scale(${viewPort.zoom})`,
    };

    const cm = classNames("base-node-view", props.className, {
      dragged,
      dark,
      "display-mode": displayMode,
    });

    const correctX = pos.x * viewPort.zoom - viewPort.pos.x * viewPort.zoom;
    const correctY = pos.y * viewPort.zoom - viewPort.pos.y * viewPort.zoom;

    const dx = correctX - pos.x;
    const dy = correctY - pos.y;

    const fixerStyle: any = {
      transform: `translate(${dx}px, ${dy}px)`,
    };

    const outerCm = classNames("base-node-view-vp-fixer", {
      "display-mode": displayMode,
    });

    const draggableContent = (
      <span className="base-node-view-wrapper">
        <div className={cm} style={zoomFixStyle} id={props.domId}>
          {props.children}
        </div>
      </span>
    );

    return (
      <div className={outerCm} style={fixerStyle}>
        <Draggable
          onStop={_onDragEnd}
          onStart={_onDragStart}
          onDrag={_onDragMove}
          position={pos}
          cancel=".no-drag"
        >
          {draggableContent}
        </Draggable>
      </div>
    );
  };
