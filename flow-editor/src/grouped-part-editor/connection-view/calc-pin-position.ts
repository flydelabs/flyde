import { Pos, PartDefinition } from "@flyde/core";
import { Size } from "../../utils";
import { getMainPinDomId, getPinDomId } from "../dom-ids";

export const calcPinPosition = (
  parentInsId: string,
  insId: string,
  pinId: string,
  type: "output" | "input",
  boardPos: Pos
) => {
  const elem = document.getElementById(getPinDomId(parentInsId, insId, pinId, type));

  if (elem) {
    const { x, y, width, height } = elem.getBoundingClientRect();
    const mx = x + width / 2;
    const my = y + height / 2;
    return {
      x: mx - boardPos.x,
      y: my - boardPos.y,
    };
  }

  return {
    x: 99999,
    y: 99999,
  };
};

export const calcMainInputPosition = (
  _: PartDefinition,
  __: Size,
  pinId: string,
  insId: string,
  type: "output" | "input",
  boardPos: Pos
) => {
  const domId = getMainPinDomId(insId, pinId, type);
  const elem = document.getElementById(domId);

  if (elem) {
    const { x, y, width, height } = elem.getBoundingClientRect();
    const mx = x + width / 2;
    const my = y + height / 2;
    return {
      x: mx - boardPos.x,
      y: my - boardPos.y,
    };
  }

  console.warn(`Cannot find element to draw connection to`, domId);

  return {
    x: 99999,
    y: 99999,
  };
};

export const calcMainOutputPosition = (
  _: PartDefinition,
  __: Size,
  pinId: string,
  insId: string,
  type: "input" | "output",
  boardPos: Pos
) => {
  const domId = getMainPinDomId(insId, pinId, type);
  const elem = document.getElementById(domId);

  if (elem) {
    const { x, y, width, height } = elem.getBoundingClientRect();
    const mx = x + width / 2;
    const my = y + height / 2;
    return {
      x: mx - boardPos.x,
      y: my - boardPos.y,
    };
  }

  console.warn(`Cannot find element to draw connection to`, domId);
  return {
    x: 99999,
    y: 99999,
  };
};
