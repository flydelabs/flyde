import React from "react";
import { safeLocalstorage } from "../../lib/safe-ls";
import { Pos, Size } from "../../utils";
import { ViewPort } from "../utils";

// ;

export interface LayoutDebuggerProps {
  viewPort: ViewPort;
  pos: Pos;
  size: Size;
  color: string;
}

export const PosDebugger: React.FC<{ pos: Pos }> = (props) => {
  const { x, y } = props.pos;
  const turnedOn = safeLocalstorage.getItem("debugger") === "true";
  if (turnedOn) {
    return (
      <span className="pos-debugger">
        {x.toFixed(1)},{y.toFixed(1)}
      </span>
    );
  }
  return null;
};

export const LayoutDebugger: React.FC<LayoutDebuggerProps> = (props) => {
  const { pos, viewPort, size, color } = props;

  const z = viewPort.zoom;

  const correctX = pos.x * z - viewPort.pos.x * z;
  const correctY = pos.y * z - viewPort.pos.y * z;

  const dx = correctX - pos.x;
  const dy = correctY - pos.y;

  const fixerStyle: any = {
    transform: `translate(${dx}px, ${dy}px)`,
  };

  const zoomWrapperStyle = {
    transform: `scale(${viewPort.zoom})`,
  };

  const dragSimStyle = {
    transform: `translate(${pos.x}px, ${pos.y}px)`,
  };

  const insideElemStyle = {
    width: `${size.width}px`,
    height: `${size.height}px`,
    backgroundColor: color,
  };

  return (
    <div className="layout-debugger" style={fixerStyle}>
      <span className="drag-sim" style={dragSimStyle}>
        <PosDebugger pos={pos} />
        <div className="layout-debugger-zoom-wrapper" style={zoomWrapperStyle}>
          <div className="layout-debugger-inner" style={insideElemStyle} />
        </div>
      </span>
    </div>
  );
};
