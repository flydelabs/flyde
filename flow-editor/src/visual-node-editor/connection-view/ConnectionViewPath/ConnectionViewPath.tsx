import { Pos } from "@flyde/core";
import classNames from "classnames";
import React, { forwardRef } from "react";
import { calcBezierPath } from "../bezier";

export interface ConnectionViewPathProps {
  from: Pos;
  to: Pos;
  className: string;
  onContextMenu?: (e: React.MouseEvent<any, MouseEvent>) => void;
  zoom: number;
  label?: string;
  dashed?: boolean;
}

export const ConnectionViewPath: React.FC<ConnectionViewPathProps> = forwardRef(
  (props, ref) => {
    const { from, to, className, onContextMenu, zoom, dashed } = props;
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

    return (
      <>
        <path
          d={d}
          ref={ref as any}
          className={classNames("connection", className)}
          style={{ strokeWidth, strokeDasharray }}
          onContextMenu={onContextMenu}
        />
        {props.label ? (
          <text
            className="label"
            x={(x1 + x2) / 2}
            y={(y1 + y2) / 2}
            fontSize="12px"
          />
        ) : null}
        <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" />
          <stop offset="100%" />
        </linearGradient>
      </>
    );
  }
);
