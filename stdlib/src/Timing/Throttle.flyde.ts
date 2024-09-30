import { TIMING_NAMESPACE, timeToString } from "./common";
import {
  ImprovedMacroNode,
  macro2toMacro,
  replaceInputsInValue,
} from "../ImprovedMacros/improvedMacros";
import { macroConfigurableValue, MacroConfigurableValue } from "@flyde/core";

const namespace = TIMING_NAMESPACE;

export interface ThrottleConfig {
  delayMs: MacroConfigurableValue;
}

const throttle: ImprovedMacroNode<ThrottleConfig> = {
  id: "Throttle",
  menuDisplayName: "Throttle",
  namespace,
  defaultStyle: {
    icon: "fa-hand",
  },
  defaultConfig: { delayMs: macroConfigurableValue("number", 420) },
  menuDescription:
    "Limits the number of times a value is emitted to once per time configured. Supports both static and dynamic intervals.",
  displayName: (config) => {
    return `Throttle ${timeToString(config.delayMs.value)}`;
  },
  description: (config) => {
    return `Throttles input values with an interval of ${timeToString(
      config.delayMs.value
    )}.`;
  },
  inputs: {
    value: { description: "Value to throttle" },
  },
  outputs: {
    unthrottledValue: { description: "Unthrottled value" },
  },
  reactiveInputs: ["value"],
  completionOutputs: [],
  run: async (inputs, outputs, adv) => {
    const { unthrottledValue } = outputs;
    const delayMs = replaceInputsInValue(inputs, adv.context.config.delayMs);

    const promise = adv.state.get("promise");
    if (promise) {
      adv.onError(new Error(`Throttle: Value dropped`));
      return;
    } else {
      unthrottledValue.next(inputs.value);
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
