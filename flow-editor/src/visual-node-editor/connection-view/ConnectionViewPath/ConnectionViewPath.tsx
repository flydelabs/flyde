import { Pos } from "@flyde/core";
import classNames from "classnames";
import React, { forwardRef } from "react";
import { calcBezierPath, Position } from "../bezier";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@flyde/ui";

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
  onToggleHidden?: () => void;
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
      onToggleHidden,
    } = props;
    const { x: x1, y: y1 } = from;
    const { x: x2, y: y2 } = to;

    const d = calcBezierPath({
      sourceX: x1,
      sourceY: y1,
      sourcePosition: Position.Right,
      targetX: x2,
      targetY: y2,
      targetPosition: Position.Left,
      curvature: 0.3,
    });

    const strokeWidth = 2.5 * zoom;
    const strokeDasharray = dashed ? 6 * zoom : undefined;

    const pathProximityMask = (
      <path
        onClick={props.onClick}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        d={d}
        className="cursor-pointer"
        style={{ opacity: 0, strokeWidth: 40 * zoom }}
      />
    );

    const borderPath = (
      <path
        d={d}
        ref={ref as any}
        style={{
          stroke: className.includes("added")
            ? "#4ADE80"
            : className.includes("removed")
            ? "#F87171"
            : className.includes("changed")
            ? "#60A5FA"
            : "#6A6A6A",
          strokeWidth: 3 * zoom,
          fill: "none",
          strokeDasharray,
        }}
      />
    );

    const path = (
      <path
        d={d}
        style={{
          stroke: className.includes("added")
            ? "#86EFAC"
            : className.includes("removed")
            ? "#FCA5A5"
            : className.includes("changed")
            ? "#93C5FD"
            : "#D0D0D0",
          strokeWidth: zoom,
          fill: "none",
          strokeDasharray,
        }}
      />
    );

    return (
      <ContextMenu>
        <ContextMenuTrigger asChild>
          <g className={classNames("connection-view-path", className)}>
            {borderPath}
            {path}
            {pathProximityMask}
          </g>
        </ContextMenuTrigger>
        <ContextMenuContent>
          {onToggleHidden && (
            <ContextMenuItem onClick={onToggleHidden}>
              Toggle Hidden
            </ContextMenuItem>
          )}
          <ContextMenuItem onClick={onDelete} className="text-destructive">
            Delete connection
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>
    );
  }
);
