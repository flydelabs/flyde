import { Pos } from "@flyde/core";
import classNames from "classnames";
import React, { forwardRef } from "react";
import { calcBezierPath } from "../bezier";

export interface ConnectionViewPathProps {
  from: Pos;
  to: Pos;
  className: string;
  onClick?: (e: React.MouseEvent<any, MouseEvent>) => void;
  onMouseProximity?: (isMouseClose: boolean) => void;
  zoom: number;
  dashed?: boolean;
}

export const ConnectionViewPath: React.FC<ConnectionViewPathProps> = forwardRef(
  (props, ref) => {
    const { from, to, className, zoom, dashed } = props;
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
        onMouseEnter={() => props.onMouseProximity(true)}
        onMouseLeave={() => props.onMouseProximity(false)}
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

    return (
      <>
        {path}
        {pathProximityMask}
        <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" />
          <stop offset="100%" />
        </linearGradient>
      </>
    );
  }
);
