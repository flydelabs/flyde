import { Pos } from "@flyde/core";
import classNames from "classnames";
import React, { forwardRef } from "react";
import { calcBezierPath, Position } from "../bezier";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "../../../ui";

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

    const isSelected = className.split(/\s+/).includes("selected");
    const isPendingSelection = className.includes("pending-selection");

    const strokeWidth = (isSelected ? 4 : 2.5) * zoom;
    const strokeDasharray = dashed || isPendingSelection ? 6 * zoom : undefined;

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

    // Determine stroke color based on status
    const getBorderStroke = () => {
      if (className.includes("added")) return "#4ADE80";
      if (className.includes("removed")) return "#F87171";
      if (className.includes("changed")) return "#60A5FA";
      if (isSelected) return "#2887f4"; // Brand blue for selected
      // No special color for pending selection
      return "#6A6A6A"; // Default
    };

    const borderPath = (
      <path
        d={d}
        ref={ref as any}
        style={{
          stroke: getBorderStroke(),
          strokeWidth: strokeWidth,
          fill: "none",
          strokeDasharray,
        }}
      />
    );

    // Determine inner path stroke color
    const getPathStroke = () => {
      if (className.includes("added")) return "#86EFAC";
      if (className.includes("removed")) return "#FCA5A5";
      if (className.includes("changed")) return "#93C5FD";
      if (isSelected) return "#2987f4"; // Lighter brand blue for selected
      // No special color for pending selection
      return "#D0D0D0"; // Default
    };

    const path = (
      <path
        d={d}
        style={{
          stroke: getPathStroke(),
          strokeWidth: isSelected ? 1.2 * zoom : zoom,
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
