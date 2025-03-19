import { keys, NodeInstance, Pos, NodeDefinition } from "@flyde/core";

import {
  MAX_INSTANCE_WIDTH,
  MIN_WIDTH_PER_PIN,
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

export const calcNodeWidth = (instance: NodeInstance, node: NodeDefinition) => {
  const allInputKeys = keys(node.inputs);
  const visibleInputs = allInputKeys.length;
  const minWidth = visibleInputs * MIN_WIDTH_PER_PIN;
  const nodeContent = calcNodeContent(instance, node);

  const charWidth = PIECE_CHAR_WIDTH;

  return clamp(
    nodeContent.length * charWidth + PIECE_HORIZONTAL_PADDING * 2,
    minWidth,
    MAX_INSTANCE_WIDTH
  );

  // return Math.max(minWidth, nodeContent.length * charWidth + PIECE_HORIZONTAL_PADDING * 2);
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
