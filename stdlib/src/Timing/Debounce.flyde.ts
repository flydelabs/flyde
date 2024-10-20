import { TIMING_NAMESPACE, timeToString } from "./common";
import {
  improvedMacro2ToOldMacro,
  ImprovedMacroNode2,
} from "../ImprovedMacros/improvedMacros2";

const namespace = TIMING_NAMESPACE;

const debounce: ImprovedMacroNode2 = {
  id: "Debounce",
  namespace,
  menuDisplayName: "Debounce",
  icon: "hourglass",
  menuDescription:
    "Emits the last value received after being idle for a given amount of milliseconds. Supports both static and dynamic delays.",
  description: (config) => {
    return `Debounces input values with a delay of ${timeToString(
      config.delayMs
    )}.`;
  },
  inputs: {
    value: {
      description: "Value to debounce",
      mode: "reactive",
    },
    delayMs: {
      defaultValue: 420,
      description: "Debounce delay in milliseconds",
      editorType: "number",
      editorTypeData: { min: 0 },
    },
  },
  outputs: {
    debouncedValue: { description: "Debounced value" },
  },
  completionOutputs: ["debouncedValue"],
  run: ({ value, delayMs }, outputs, adv) => {
    const { debouncedValue } = outputs;

    const timer = adv.state.get("timer");
    if (timer) {
      clearTimeout(timer);
    }

    const newTimer = setTimeout(() => {
      debouncedValue.next(value);
    }, delayMs);

    adv.state.set("timer", newTimer);

    adv.onCleanup(() => {
      clearTimeout(timer);
    });
  },
};

export const Debounce = improvedMacro2ToOldMacro(debounce);
