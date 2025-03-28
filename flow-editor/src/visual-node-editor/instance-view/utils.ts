import { keys, NodeInstance, Pos, NodeDefinition } from "@flyde/core";

import {
  MAX_INSTANCE_WIDTH,
  PIECE_CHAR_WIDTH,
  PIECE_HORIZONTAL_PADDING,
} from "./InstanceView";

import { clamp } from "lodash";
import { getInstanceDomId } from "../dom-ids";
import { unfoundPinPos } from "../connection-view/calc-pin-position";

export const calcNodeContent = (
  instance: Pick<NodeInstance, "displayName">,
  node: Pick<NodeDefinition, "displayName" | "id">
) => {
  if (instance.displayName) {
    return instance.displayName;
  }

  return node.displayName ?? node.id;
};

export const calcNodeWidth = (_: NodeInstance) => {
  return 200; // TODO: calculate width based on instance content
};

export const calcInstancePosition = (
  insId: string,
  parentInsId: string,
  boardPos: Pos
) => {
  const domId = getInstanceDomId(insId, parentInsId);
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

  return unfoundPinPos;
};
