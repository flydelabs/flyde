import { TIMING_NAMESPACE, timeToString } from "./common";
import {
  ImprovedMacroNode,
  improvedMacroToOldMacro,
  extractInputsFromValue,
  replaceInputsInValue,
} from "../ImprovedMacros/improvedMacros";
import { macroConfigurableValue, MacroConfigurableValue } from "@flyde/core";

const namespace = TIMING_NAMESPACE;

export interface IntervalConfig {
  time: MacroConfigurableValue;
  value: MacroConfigurableValue;
}

const interval: ImprovedMacroNode<IntervalConfig> = {
  id: "Interval",
  menuDisplayName: "Interval",
  namespace,
  defaultStyle: {
    icon: "stopwatch",
  },
  defaultConfig: {
    time: macroConfigurableValue("number", 1000),
    value: macroConfigurableValue("string", "sparkles"),
  },
  menuDescription: "Emits a value every interval",
  displayName: (config) => {
    const value = JSON.stringify(config.value.value);
    return `Emit ${value} each ${timeToString(config.time.value)}`;
  },
  description: (config) => {
    return `Emits ${JSON.stringify(config.value.value)} every ${timeToString(
      config.time.value
    )}.`;
  },
  inputs: (config) => ({
    ...extractInputsFromValue(config.value, "value"),
    ...extractInputsFromValue(config.time, "time"),
  }),
  outputs: {
    value: { description: "Emitted value" },
  },
  reactiveInputs: ["interval"],
  completionOutputs: [],
  run: (inputs, outputs, adv) => {
    const { time, value } = adv.context.config;

    const intervalValue = replaceInputsInValue(inputs, time, "time");
    const emitValue = replaceInputsInValue(inputs, value, "value");

    const existingTimer = adv.state.get("timer");
    if (existingTimer) {
      clearInterval(existingTimer);
    }

    const timer = setInterval(() => {
      outputs.value.next(emitValue);
    }, intervalValue);

    adv.state.set("timer", timer);

    adv.onCleanup(() => {
      clearInterval(timer);
    });
  },
  configEditor: {
    type: "structured",
    fields: [
      {
        type: "number",
        configKey: "time",
        label: "Interval",
      },
      {
        type: "json",
        configKey: "value",
        label: "Value to emit (supports templates)",
      },
    ],
  },
};

export const Interval = improvedMacroToOldMacro(interval);
