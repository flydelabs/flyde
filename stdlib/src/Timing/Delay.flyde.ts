import { TIMING_NAMESPACE, timeToString } from "./common";
import {
  ImprovedMacroNode,
  replaceInputsInValue,
  macro2toMacro,
} from "../ImprovedMacros/improvedMacros";
import { MacroConfigurableValue } from "@flyde/core";

const namespace = TIMING_NAMESPACE;

export interface DelayConfig {
  delayMs: MacroConfigurableValue;
}

const delay: ImprovedMacroNode<DelayConfig> = {
  id: "Delay",
  menuDisplayName: "Delay",
  namespace,
  defaultStyle: {
    icon: "clock",
  },
  defaultConfig: {
    delayMs: { type: "number", value: 1000 },
  },
  menuDescription:
    "Delays a value by a given amount of time. Supports both static and dynamic delays.",
  displayName: (config) => {
    if (config.delayMs.type === "number") {
      return `Delay ${timeToString(config.delayMs.value)}`;
    } else {
      return `Delay ${config.delayMs.value}`;
    }
  },
  description: (config) => {
    if (config.delayMs.type === "number") {
      return `Delays a value by ${timeToString(config.delayMs.value)}.`;
    } else {
      return `Delays a value by ${config.delayMs.value}.`;
    }
  },
  inputs: {
    value: { description: "Value to delay" },
  },
  outputs: {
    delayedValue: { description: "Delayed value" },
  },
  reactiveInputs: ["value"],
  completionOutputs: ["delayedValue"],
  run: async (inputs, outputs, adv) => {
    const { delayedValue } = outputs;
    const { delayMs } = adv.context.config;

    const delayValue = replaceInputsInValue(inputs, delayMs);
    await new Promise((resolve) => setTimeout(resolve, delayValue));
    delayedValue.next(inputs.value);
  },
};

export const Delay = macro2toMacro(delay);
