import React from "react";
import { ViewPort } from "../utils";
import { getSelectionBoxRect, logicalPosToRenderedPos } from "../utils";
import { Pos } from "@flyde/core";

export interface SelectionBoxProps {
  selectionBox?: { from: Pos; to: Pos };
  viewPort: ViewPort;
}

export const SelectionBox: React.FC<SelectionBoxProps> = ({
  selectionBox,
  viewPort,
}) => {
  if (!selectionBox) return null;

  const { from, to } = selectionBox;
  const realFrom = logicalPosToRenderedPos(from, viewPort);
  const realTo = logicalPosToRenderedPos(to, viewPort);
  const { x, y, w, h } = getSelectionBoxRect(realFrom, realTo);

  return (
    <div
      className="selection-box"
      style={{ top: y, left: x, width: w, height: h }}
    />
  );
};
