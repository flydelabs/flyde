import {
  okeys,
  OMap,
  PartInstance,
  PartDefinition,
  PartDefRepo,
  isCodePart,
  
  Pos,
  isStaticInput,
  isStaticInputPinConfig,
  getStaticValue,
  StaticInputPinConfig,
  ResolvedFlydeFlowDefinition,
} from "@flyde/core";

import * as ejs from 'ejs';

import { isDefined } from "../../utils";

import {
  MAX_INSTANCE_WIDTH,
  MIN_WIDTH_PER_PIN,
  PIECE_CHAR_WIDTH,
  PIECE_HORIZONTAL_PADDING,
} from "./InstanceView";

import { clamp } from "lodash";
import { getInstanceDomId, getMainPinDomId } from "../dom-ids";

export const calcPartContent = (
  instance: PartInstance,
  part: PartDefinition
) => {
  if (part.customViewCode) {
    try {
      const inputs = Object.entries(instance.inputConfig)
        .filter(([, v]) => isStaticInputPinConfig(v))
        .reduce((p, [k, v]) => ({ ...p, [k]:  (v as StaticInputPinConfig).value }), {});

      return ejs.render(part.customViewCode, { inputs, isDefined }).trim(); // TODO: render with ejs or equivalent. Removed due to wp5 issues

      // // hack to render detached embedded parts correctly
      // if (maybeGetStaticValuePartId(result)) {
      //   return toString(result);
      // } else {
      //   return result || part.id;
      // }
    } catch (e) {
      console.error("Error with custom view", e);
      return `Error in custom view [${part.id}]`;
    }
  }

  return part.id;
};

export const calcPartWidth = (
  instance: PartInstance,
  part: PartDefinition
) => {
  const allInputKeys = okeys(part.inputs);
  const visibleInputs = allInputKeys.length;
  const minWidth = visibleInputs * MIN_WIDTH_PER_PIN;
  const partContent = calcPartContent(instance, part);

  const charWidth = PIECE_CHAR_WIDTH;

  return clamp(
    partContent.length * charWidth + PIECE_HORIZONTAL_PADDING * 2,
    minWidth,
    MAX_INSTANCE_WIDTH
  );

  // return Math.max(minWidth, partContent.length * charWidth + PIECE_HORIZONTAL_PADDING * 2);
};

export const calcInstancePosition = (insId: string, parentInsId: string, boardPos: Pos) => {
  const domId = getInstanceDomId(parentInsId, insId);
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
