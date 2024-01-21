import { InputPinMap, MacroNode } from "@flyde/core";
import { TIMING_NAMESPACE, TimingNodeConfig } from "./common";

export { Delay } from "./Delay/Delay.flyde";
export { Interval } from "./Interval/Interval.flyde";

const namespace = TIMING_NAMESPACE;

export type DebounceConfig = TimingNodeConfig;

export const Debounce: MacroNode<DebounceConfig> = {
  id: "Debounce",
  displayName: "Debounce",
  namespace,
  defaultData: { mode: "static", timeMs: 420 },
  description:
    "Emits the last value received after being idle for a given amount of milliseconds. Supports both static and dynamic delays.",
  definitionBuilder: (config) => {
    const inputs: InputPinMap = { value: { description: "Value to debounce" } };

    if (config.mode === "dynamic") {
      inputs.delay = { description: "Delay in milliseconds" };
    }

    return {
      inputs,
      outputs: {
        debouncedValue: { description: "Debounced value" },
      },
      reactiveInputs: ["value"],
      completionOutputs: ["debouncedValue"],
    };
  },
  runFnBuilder: (config) => {
    return async ({ value, delay }, outputs, adv) => {
      const { debouncedValue } = outputs;

      const timer = adv.state.get("timer");
      if (timer) {
        clearTimeout(timer);
      }

      const newTimer = setTimeout(
        () => {
          debouncedValue.next(value);
        },
        config.mode === "dynamic" ? delay : config.timeMs
      );

      adv.state.set("timer", newTimer);

      adv.onCleanup(() => {
        clearTimeout(timer);
      });
    };
  },
  editorComponentBundlePath: "../../../dist/ui/Debounce.js",
};

export class ThrottleError extends Error {
  value: any;
  constructor(value: any) {
    super("Throttle: Value dropped");
    this.value = value;
  }
}

export type ThrottleConfig = TimingNodeConfig;

export const Throttle: MacroNode<ThrottleConfig> = {
  id: "Throttle",
  displayName: "Throttle",
  namespace,
  defaultData: { mode: "static", timeMs: 420 },
  description:
    "Limits the number of times a value is emitted to once per time configured. Supports both static and dynamic intervals.",
  definitionBuilder: (config) => {
    const inputs: InputPinMap = { value: { description: "Value to throttle" } };
    if (config.mode === "dynamic") {
      inputs.limitTime = { description: "Interval in milliseconds" };
    }
    return {
      inputs,
      outputs: {
        throttledValue: { description: "Throttled value" },
      },
      reactiveInputs: ["value"],
    };
  },
  runFnBuilder: (config) => {
    return async ({ value, limitTime }, outputs, adv) => {
      const { throttledValue } = outputs;

      const timeMs = config.mode === "dynamic" ? limitTime : config.timeMs;

      const timer = adv.state.get("timer");
      if (timer) {
        adv.onError(new ThrottleError(value));
        return;
      } else {
        throttledValue.next(value);
        const newTimer = setTimeout(() => {
          adv.state.set("timer", null);
        }, timeMs);
        adv.state.set("timer", newTimer);
      }
    };
  },
  editorComponentBundlePath: "../../../dist/ui/Throttle.js",
};
