import { InputPinMap, MacroNode } from "@flyde/core";
import { TIMING_NAMESPACE, TimingNodeConfig, timeToString } from "./common";

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

    const displayName = (() => {
      if (config.mode === "dynamic") {
        return "Debounce";
      } else {
        return `Debounce ${timeToString(config.timeMs)}`;
      }
    })();

    return {
      inputs,
      displayName,
      outputs: {
        debouncedValue: { description: "Debounced value" },
      },
      reactiveInputs: ["value"],
      completionOutputs: ["debouncedValue"],
    };
  },
  runFnBuilder: (config) => {
    return ({ value, delay }, outputs, adv) => {
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

    const displayName = (() => {
      if (config.mode === "dynamic") {
        return "Throttle";
      } else {
        return `Throttle ${timeToString(config.timeMs)}`;
      }
    })();
    return {
      inputs,
      displayName,
      outputs: {
        unthrottledValue: { description: "Unthrottled value" },
      },
      reactiveInputs: ["value"],
    };
  },
  runFnBuilder: (config) => {
    return async (inputs, outputs, adv) => {
      const timeMs =
        config.mode === "dynamic" ? inputs.limitTime : config.timeMs;

      const promise = adv.state.get("promise");
      if (promise) {
        adv.onError(new ThrottleError(inputs.value));
        return;
      } else {
        outputs.unthrottledValue.next(inputs.value);
        const promise = new Promise<void>((resolve) => {
          setTimeout(() => {
            resolve();
          }, timeMs);
        });
        adv.state.set("promise", promise);

        await promise;
        adv.state.set("promise", undefined);
      }
    };
  },
  editorComponentBundlePath: "../../../dist/ui/Throttle.js",
};
