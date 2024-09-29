import { TIMING_NAMESPACE, timeToString } from "./common";
import { MacroNodeV2, macro2toMacro } from "../ImprovedMacros/improvedMacros";

const namespace = TIMING_NAMESPACE;

export interface DelayConfig {
  delayMs: number;
}

const delay: MacroNodeV2<DelayConfig> = {
  id: "Delay",
  menuDisplayName: "Delay",
  namespace,
  defaultStyle: {
    icon: "clock",
  },
  defaultConfig: { delayMs: 420 },
  menuDescription:
    "Delays a value by a given amount of time. Supports both static and dynamic delays.",
  displayName: (config) => {
    return `Delay ${timeToString(config.delayMs)}`;
  },
  description: (config) => {
    return `Delays a value by ${timeToString(config.delayMs)}.`;
  },
  inputs: {
    value: { description: "Value to delay" },
  },
  outputs: {
    delayedValue: { description: "Delayed value" },
  },
  reactiveInputs: ["value"],
  completionOutputs: ["delayedValue"],
  run: async ({ value, delay }, outputs, adv) => {
    const { delayedValue } = outputs;
    const { delayMs } = adv.context.config;

    const delayValue = delay !== undefined ? delay : delayMs;
    await new Promise((resolve) => setTimeout(resolve, delayValue));
    delayedValue.next(value);
  },
};

export const Delay = macro2toMacro(delay);
