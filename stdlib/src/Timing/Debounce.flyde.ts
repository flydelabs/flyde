import { TIMING_NAMESPACE, timeToString } from "./common";
import { MacroNodeV2, macro2toMacro } from "../ImprovedMacros/improvedMacros";

const namespace = TIMING_NAMESPACE;

export interface DebounceConfig {
  delayMs: number;
}

const debounce: MacroNodeV2<DebounceConfig> = {
  id: "Debounce",
  menuDisplayName: "Debounce",
  namespace,
  defaultStyle: {
    icon: "hourglass",
  },
  defaultConfig: { delayMs: 420 },
  menuDescription:
    "Emits the last value received after being idle for a given amount of milliseconds. Supports both static and dynamic delays.",
  displayName: (config) => {
    return `Debounce ${timeToString(config.delayMs)}`;
  },
  description: (config) => {
    return `Debounces input values with a delay of ${timeToString(
      config.delayMs
    )}.`;
  },
  inputs: {
    value: { description: "Value to debounce" },
  },
  outputs: {
    debouncedValue: { description: "Debounced value" },
  },
  reactiveInputs: ["value"],
  completionOutputs: ["debouncedValue"],
  run: ({ value, delay }, outputs, adv) => {
    const { debouncedValue } = outputs;
    const { delayMs } = adv.context.config;

    const timer = adv.state.get("timer");
    if (timer) {
      clearTimeout(timer);
    }

    const newTimer = setTimeout(
      () => {
        debouncedValue.next(value);
      },
      delayMs.mode === "dynamic" ? delay : delayMs.value
    );

    adv.state.set("timer", newTimer);

    adv.onCleanup(() => {
      clearTimeout(timer);
    });
  },
};

export const Debounce = macro2toMacro(debounce);
