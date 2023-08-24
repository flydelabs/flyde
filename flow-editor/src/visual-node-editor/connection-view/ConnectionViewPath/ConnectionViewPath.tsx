import { Pos } from "@flyde/core";
import classNames from "classnames";
import React from "react";
import { calcBezierPath } from "../bezier";

export interface ConnectionViewPathProps {
  from: Pos;
  to: Pos;
  className: string;
  onContextMenu?: (e: React.MouseEvent<any, MouseEvent>) => void;
  zoom: number;
  label?: string;
  dashed?: boolean;
  ref?: any;
}

export const ConnectionViewPath: React.FC<ConnectionViewPathProps> = (
  props
) => {
  const { from, to, className, onContextMenu, zoom, dashed, ref } = props;
  const { x: x1, y: y1 } = from;
  const { x: x2, y: y2 } = to;

  const d = calcBezierPath({
    sourceX: x1,
    sourceY: y1,
    targetX: x2,
    targetY: y2,
    curvature: 0.15,
  });

  const strokeWidth = 3 * zoom;
  const strokeDasharray = dashed ? 6 * zoom : undefined;

  return (
    <>
      <path
        d={d}
        ref={ref}
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
};
