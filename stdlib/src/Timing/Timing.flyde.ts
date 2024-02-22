import { ConfigurableInput, InputPinMap, MacroNode } from "@flyde/core";
import { TIMING_NAMESPACE, timeToString } from "./common";

export { Delay } from "./Delay/Delay.flyde";
export { Interval } from "./Interval/Interval.flyde";

const namespace = TIMING_NAMESPACE;

export type DebounceConfig = { delayMs: ConfigurableInput<number> };

export const Debounce: MacroNode<DebounceConfig> = {
  id: "Debounce",
  displayName: "Debounce",
  namespace,
  defaultStyle: {
    icon: "hourglass",
  },
  defaultData: { delayMs: { mode: "static", value: 420 } },
  description:
    "Emits the last value received after being idle for a given amount of milliseconds. Supports both static and dynamic delays.",
  definitionBuilder: ({ delayMs }) => {
    const inputs: InputPinMap = { value: { description: "Value to debounce" } };

    if (delayMs.mode === "dynamic") {
      inputs.delay = { description: "Delay in milliseconds" };
    }

    const displayName = (() => {
      if (delayMs.mode === "dynamic") {
        return "Debounce";
      } else {
        return `Debounce ${timeToString(delayMs.value)}`;
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
  runFnBuilder: ({ delayMs }) => {
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
        delayMs.mode === "dynamic" ? delay : delayMs.value
      );

      adv.state.set("timer", newTimer);

      adv.onCleanup(() => {
        clearTimeout(timer);
      });
    };
  },
  editorConfig: {
    type: "structured",
    fields: [
      {
        type: {
          value: "number",
        },
        configKey: "delayMs",
        label: "Delay in milliseconds",
        defaultValue: 420,
        allowDynamic: true,
      },
    ],
  },
};

export class ThrottleError extends Error {
  value: any;
  constructor(value: any) {
    super("Throttle: Value dropped");
    this.value = value;
  }
}

export type ThrottleConfig = { delayMs: ConfigurableInput<number> };

export const Throttle: MacroNode<ThrottleConfig> = {
  id: "Throttle",
  displayName: "Throttle",
  defaultStyle: {
    icon: "fa-hand",
  },
  namespace,
  defaultData: { delayMs: { mode: "static", value: 420 } },
  description:
    "Limits the number of times a value is emitted to once per time configured. Supports both static and dynamic intervals.",
  definitionBuilder: ({ delayMs }) => {
    const inputs: InputPinMap = { value: { description: "Value to throttle" } };
    if (delayMs.mode === "dynamic") {
      inputs.limitTime = { description: "Interval in milliseconds" };
    }

    const displayName = (() => {
      if (delayMs.mode === "dynamic") {
        return "Throttle";
      } else {
        return `Throttle ${timeToString(delayMs.value)}`;
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
  runFnBuilder: ({ delayMs }) => {
    return async (inputs, outputs, adv) => {
      const timeMs =
        delayMs.mode === "dynamic" ? inputs.limitTime : delayMs.value;

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
  editorConfig: {
    type: "structured",
    fields: [
      {
        type: {
          value: "number",
        },
        configKey: "delayMs",
        label: "Interval (ms)",
        defaultValue: 420,
        allowDynamic: true,
      },
    ],
  },
};
