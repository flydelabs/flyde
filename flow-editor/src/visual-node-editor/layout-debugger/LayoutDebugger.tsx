import { VisualNode, values, Pos } from "@flyde/core";
import React from "react";
import { Size } from "../../utils";
import { logicalPosToRenderedPos, ViewPort } from "../utils";

const PosView: React.FC<{ pos: Pos }> = ({ pos }) => {
  return (
    <span>
      {pos.x.toFixed(1)}, {pos.y.toFixed(1)}
    </span>
  );
};

export interface LayoutDebuggerItemProps {
  viewPort: ViewPort;
  pos: Pos;
  size: Size;
  color: string;
}

export const PosDebugger: React.FC<{ pos: Pos }> = (props) => {
  return (
    <span className="pos-debugger">
      <PosView pos={props.pos} />
    </span>
  );
};

export const LayoutDebuggerItem: React.FC<LayoutDebuggerItemProps> = (
  props
) => {
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

export interface LayoutDebuggerProps {
  extraDebug: LayoutDebuggerItemProps[];
  vp: ViewPort;
  node: VisualNode;
  mousePos: Pos;
}

const isPosDebugger = () => {
  try {
    return localStorage.getItem("pos-debugger") === "true";
  } catch (e) {
    return false;
  }
};

const isDebug = isPosDebugger();

export const LayoutDebugger: React.FC<LayoutDebuggerProps> = (props) => {
  const { extraDebug, vp, node, mousePos } = props;

  if (!isDebug) {
    return null;
  }
  const itemElems = extraDebug.map((props, idx) => (
    <LayoutDebuggerItem {...props} key={idx} />
  ));

  const baseNodeElems = [
    ...node.instances.map((i) => i.pos),
    ...values(node.inputsPosition),
    ...values(node.outputsPosition),
  ].map((pos) => (
    <LayoutDebuggerItem
      pos={pos}
      viewPort={vp}
      size={{ width: 0, height: 0 }}
      color="red"
    />
  ));

  const mouseRenderedPos = logicalPosToRenderedPos(mousePos, vp);
  const viewPortData = (
    <div className="viewport-data">
      <div>
        Pos: <PosView pos={vp.pos} />
      </div>
      <div>Zoom: {vp.zoom.toFixed(2)} </div>
      <div>
        Mouse (logical): <PosView pos={mousePos} />
      </div>
      <div>
        Rendered (rendered): <PosView pos={mouseRenderedPos} />
      </div>
    </div>
  );

  return (
    <React.Fragment>
      {viewPortData}
      {itemElems}
      {baseNodeElems}
    </React.Fragment>
  );
};
