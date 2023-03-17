import { Pos } from "@flyde/core";
import { ViewPort } from "../..";
import { getMainPinDomId, getPinDomId } from "../dom-ids";

const DEFAULT_POS = {
  x: 99999,
  y: 99999,
};

const elemPos = (
  elem: Element | undefined,
  boardPos: Pos,
  id: string,
  viewPort: ViewPort
) => {
  if (!elem) {
    console.warn(`Cannot find element ${id} to render connection`);
    return DEFAULT_POS;
  }
  const { x, y, width, height } = elem.getBoundingClientRect();

  const mx = x + width / 2;
  const my = y + height / 2;

  return {
    x: mx - boardPos.x,
    y: my - boardPos.y,
  };
};

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
  pinId: string,
  insId: string,
  type: "output" | "input",
  boardPos: Pos,
  viewPort: ViewPort,
  parentInsId: string
) => {
  const domId = getMainPinDomId(insId, pinId, type, parentInsId);
  const elem = document.getElementById(domId);

  return elemPos(elem, boardPos, domId, viewPort);
};

export const calcMainOutputPosition = (
  pinId: string,
  insId: string,
  type: "input" | "output",
  boardPos: Pos,
  viewPort: ViewPort,
  parentInsId: string
) => {
  const domId = getMainPinDomId(insId, pinId, type, parentInsId);
  const elem = document.getElementById(domId);
  return elemPos(elem, boardPos, domId, viewPort);
};
