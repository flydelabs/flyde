import { Pos } from "@flyde/core";
import classNames from "classnames";
import React, { forwardRef } from "react";
import { calcBezierPath } from "../bezier";
import { ContextMenu, Menu, MenuItem } from "@blueprintjs/core";

export interface ConnectionViewPathProps {
  from: Pos;
  to: Pos;
  className: string;
  onClick?: (e: React.MouseEvent<any, MouseEvent>) => void;
  onMouseEnter?: (e: React.MouseEvent<any, MouseEvent>) => void;
  onMouseLeave?: (e: React.MouseEvent<any, MouseEvent>) => void;
  zoom: number;
  dashed?: boolean;
  onDelete?: () => void;
}

export const ConnectionViewPath: React.FC<ConnectionViewPathProps> = forwardRef(
  (props, ref) => {
    const {
      from,
      to,
      className,
      zoom,
      dashed,
      onMouseEnter,
      onMouseLeave,
      onDelete,
    } = props;
    const { x: x1, y: y1 } = from;
    const { x: x2, y: y2 } = to;

    const d = calcBezierPath({
      sourceX: x1,
      sourceY: y1,
      targetX: x2,
      targetY: y2,
      curvature: 0.15,
    });

    const strokeWidth = 2.5 * zoom;
    const strokeDasharray = dashed ? 6 * zoom : undefined;

    const pathProximityMask = (
      <path
        onClick={props.onClick}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        d={d}
        style={{ cursor: "pointer", opacity: 0, strokeWidth: 40 * zoom }}
      />
    );

    const path = (
      <path
        d={d}
        ref={ref as any}
        className={classNames("connection", className)}
        style={{ strokeWidth, strokeDasharray }}
      />
    );

    const contextMenuContent = (
      <Menu>
        <MenuItem text="Delete connection" intent="danger" onClick={onDelete} />
      </Menu>
    );

    return (
      <ContextMenu content={contextMenuContent}>
        {(ctxMenuProps) => (
          <g
            className={classNames(
              "connection-view-path",
              ctxMenuProps.className
            )}
            onContextMenu={ctxMenuProps.onContextMenu as any}
            ref={ctxMenuProps.ref as any}
          >
            {ctxMenuProps.popover}
            {path}
            {pathProximityMask}
            <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" />
              <stop offset="100%" />
            </linearGradient>
          </g>
        )}
      </ContextMenu>
    );
  }
);
