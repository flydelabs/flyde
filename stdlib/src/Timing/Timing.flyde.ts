import { InputPinMap, MacroNode } from "@flyde/core";

const namespace = "Timing";

export type TimingNodeConfig =
  | { type: "dynamic"; timeMs?: number }
  | { type: "static"; timeMs: number };

export type DelayConfig = TimingNodeConfig;

export const Delay: MacroNode<DelayConfig> = {
  id: "Delay",
  displayName: "Delay",
  namespace,
  defaultData: { type: "static", timeMs: 420 },
  description:
    "Delays a value by a given amount of time. Supports both static and dynamic delays.",
  definitionBuilder: (config) => {
    const inputs: InputPinMap = { value: { description: "Value to delay" } };

    if (config.type === "dynamic") {
      inputs.delay = { description: "Delay in milliseconds" };
    }

    return {
      inputs,
      outputs: {
        delayedValue: { description: "Delayed value" },
      },
      run: async ({ value, delay }, { delayedValue }) => {
        await new Promise((resolve) => setTimeout(resolve, delay));
        delayedValue.next(value);
      },
    };
  },
  runFnBuilder: (config) => {
    return async ({ value, delay }, outputs) => {
      const delayValue = config.type === "dynamic" ? delay : config.timeMs;
      await new Promise((resolve) => setTimeout(resolve, delayValue));
      outputs.delayedValue.next(value);
    };
  },
  editorComponentBundlePath: "../../../dist/ui/Delay.js",
};

export type IntervalConfig = TimingNodeConfig;

export const Interval: MacroNode<TimingNodeConfig> = {
  id: "Interval",
  displayName: "Interval",
  namespace,

  defaultData: { type: "static", timeMs: 420 },
  description:
    "Emits a value every interval. Supports both static and dynamic intervals.",
  definitionBuilder: (config) => {
    const inputs: InputPinMap = { value: { description: "Value to emit" } };

    if (config.type === "dynamic") {
      inputs.interval = { description: "Interval in milliseconds" };
    }

    return {
      inputs,
      outputs: {
        value: { description: "Emitted value" },
      },
      reactiveInputs:
        config.type === "dynamic" ? ["value", "interval"] : ["value"],
      completionOutputs: [],
    };
  },
  runFnBuilder: (config) => {
    return ({ value, interval }, outputs, adv) => {
      const intervalValue =
        config.type === "dynamic" ? interval : config.timeMs;

      const existingTimer = adv.state.get("timer");
      if (existingTimer) {
        clearInterval(existingTimer);
      }

      const timer = setInterval(() => {
        outputs.value.next(value);
      }, intervalValue);

      adv.state.set("timer", timer);

      adv.onCleanup(() => {
        clearInterval(timer);
      });
    };
  },
  editorComponentBundlePath: "../../../dist/ui/Interval.js",
};

export type DebounceConfig = TimingNodeConfig;

export const Debounce: MacroNode<DebounceConfig> = {
  id: "Debounce",
  displayName: "Debounce",
  namespace,
  defaultData: { type: "static", timeMs: 420 },
  description:
    "Emits the last value received after being idle for a given amount of milliseconds. Supports both static and dynamic delays.",
  definitionBuilder: (config) => {
    const inputs: InputPinMap = { value: { description: "Value to debounce" } };

    if (config.type === "dynamic") {
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
        config.type === "dynamic" ? delay : config.timeMs
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
  defaultData: { type: "static", timeMs: 420 },
  description:
    "Limits the number of times a value is emitted to once per time configured. Supports both static and dynamic intervals.",
  definitionBuilder: (config) => {
    const inputs: InputPinMap = { value: { description: "Value to throttle" } };
    if (config.type === "dynamic") {
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

      const timeMs = config.type === "dynamic" ? limitTime : config.timeMs;

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
