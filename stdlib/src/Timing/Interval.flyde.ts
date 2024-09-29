import { TIMING_NAMESPACE, timeToString } from "./common";
import {
  MacroNodeV2,
  macro2toMacro,
  extractInputsFromValue,
  replaceInputsInValue,
} from "../ImprovedMacros/improvedMacros";

const namespace = TIMING_NAMESPACE;

export interface IntervalConfig {
  time: number;
  value: any;
}

const interval: MacroNodeV2<IntervalConfig> = {
  id: "Interval",
  menuDisplayName: "Interval",
  namespace,
  defaultStyle: {
    icon: "stopwatch",
  },
  defaultConfig: {
    time: 1000,
    value: "",
  },
  menuDescription: "Emits a value every interval",
  displayName: (config) => {
    const value = JSON.stringify(config.value);
    return `Emit ${value} each ${timeToString(config.time)}`;
  },
  description: (config) => {
    return `Emits ${JSON.stringify(config.value)} every ${timeToString(
      config.time
    )}.`;
  },
  inputs: (config) => ({
    ...extractInputsFromValue(config.value),
  }),
  outputs: {
    value: { description: "Emitted value" },
  },
  reactiveInputs: ["interval"],
  completionOutputs: [],
  run: (inputs, outputs, adv) => {
    const { time, value } = adv.context.config;

    const intervalValue = inputs.interval ?? time;
    const emitValue = replaceInputsInValue(inputs, value);

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

export const Interval = macro2toMacro(interval);
