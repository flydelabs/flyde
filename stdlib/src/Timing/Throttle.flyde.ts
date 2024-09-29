import { TIMING_NAMESPACE, timeToString } from "./common";
import { MacroNodeV2, macro2toMacro } from "../ImprovedMacros/improvedMacros";

const namespace = TIMING_NAMESPACE;

export interface ThrottleConfig {
  delayMs: number;
}

const throttle: MacroNodeV2<ThrottleConfig> = {
  id: "Throttle",
  menuDisplayName: "Throttle",
  namespace,
  defaultStyle: {
    icon: "fa-hand",
  },
  defaultConfig: { delayMs: 420 },
  menuDescription:
    "Limits the number of times a value is emitted to once per time configured. Supports both static and dynamic intervals.",
  displayName: (config) => {
    return `Throttle ${timeToString(config.delayMs)}`;
  },
  description: (config) => {
    return `Throttles input values with an interval of ${timeToString(
      config.delayMs
    )}.`;
  },
  inputs: {
    value: { description: "Value to throttle" },
  },
  outputs: {
    unthrottledValue: { description: "Unthrottled value" },
  },
  reactiveInputs: ["value"],
  run: async ({ value }, outputs, adv) => {
    const { unthrottledValue } = outputs;
    const { delayMs } = adv.context.config;

    const promise = adv.state.get("promise");
    if (promise) {
      adv.onError(new Error(`Throttle: Value dropped`));
      return;
    } else {
      unthrottledValue.next(value);
      const promise = new Promise<void>((resolve) => {
        setTimeout(() => {
          resolve();
        }, delayMs);
      });
      adv.state.set("promise", promise);

      await promise;
      adv.state.set("promise", undefined);
    }
  },
};

export const Throttle = macro2toMacro(throttle);
