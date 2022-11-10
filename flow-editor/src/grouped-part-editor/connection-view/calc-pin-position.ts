import { Pos, PartDefinition } from "@flyde/core";
import { logicalPosToRenderedPos, renderedPosToLogicalPos, ViewPort } from "../..";
import { Size } from "../../utils";
import { calcZoom } from "../calc-zoom";
import { getMainPinDomId, getPinDomId } from "../dom-ids";

const DEFAULT_POS = {
  x: 99999,
  y: 99999,
};

const elemPos = (elem: Element | undefined, boardPos: Pos, id: string, viewPort: ViewPort) => {
  if (!elem) {
    console.warn(`Cannot find element ${id} to render connection`);
    return DEFAULT_POS;
  }
  const { x, y, width, height } = elem.getBoundingClientRect();

  const browserZoom = calcZoom();
  
  const mx = x + width / 2;
  const my = y + height / 2;

  return {
    /*
      can't really explain why the formula for x is different than y
      wanted to fix the zoom bug on vscode fast and this did the trick for a the 80% - 125% range
     */
    x: (mx - boardPos.x) * browserZoom, 
    y: my - (boardPos.y * browserZoom)
  };
}



export const calcPinPosition = (
  parentInsId: string,
  insId: string,
  pinId: string,
  type: "output" | "input",
  boardPos: Pos,
  viewPort: ViewPort
) => {
  const domId = getPinDomId(parentInsId, insId, pinId, type);
  const elem = document.getElementById(domId);
  return elemPos(elem, boardPos, domId, viewPort);
};

export const calcMainInputPosition = (
  _: PartDefinition,
  __: Size,
  pinId: string,
  insId: string,
  type: "output" | "input",
  boardPos: Pos,
  viewPort: ViewPort
) => {
  const domId = getMainPinDomId(insId, pinId, type);
  const elem = document.getElementById(domId);

  return elemPos(elem, boardPos, domId, viewPort);
};

export const calcMainOutputPosition = (
  _: PartDefinition,
  __: Size,
  pinId: string,
  insId: string,
  type: "input" | "output",
  boardPos: Pos,
  viewPort: ViewPort
) => {
  const domId = getMainPinDomId(insId, pinId, type);
  const elem = document.getElementById(domId);
  return elemPos(elem, boardPos, domId, viewPort);
};
