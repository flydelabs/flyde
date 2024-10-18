import { TIMING_NAMESPACE, timeToString } from "./common";
import {
  improvedMacro2ToOldMacro,
  ImprovedMacroNode2,
} from "../ImprovedMacros/improvedMacros2";

const namespace = TIMING_NAMESPACE;

const delay: ImprovedMacroNode2 = {
  id: "Delay",
  menuDisplayName: "Delay",
  namespace,
  icon: "clock",
  menuDescription:
    "Delays a value by a given amount of time. Supports both static and dynamic delays.",
  description: (config) => {
    if (typeof config.delayMs === "number") {
      return `Delays a value by ${timeToString(config.delayMs)}.`;
    } else {
      return `Delays a value by ${config.delayMs}.`;
    }
  },
  inputs: {
    value: { description: "Value to delay" },
    delayMs: {
      defaultValue: 1000,
      description: "Delay in milliseconds",
    },
  },
  outputs: {
    delayedValue: { description: "Delayed value" },
  },
  completionOutputs: ["delayedValue"],
  run: async (inputs, outputs) => {
    const { delayedValue } = outputs;
    const { delayMs } = inputs;

    await new Promise((resolve) => setTimeout(resolve, delayMs));
    delayedValue.next(inputs.value);
  },
};

export const Delay = improvedMacro2ToOldMacro(delay);
