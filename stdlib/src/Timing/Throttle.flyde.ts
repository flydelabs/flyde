import { TIMING_NAMESPACE, timeToString } from "./common";
import { CodeNode } from "@flyde/core";

const namespace = TIMING_NAMESPACE;

export const Throttle: CodeNode = {
  id: "Throttle",
  namespace,
  menuDisplayName: "Throttle",
  icon: "fa-hand",
  displayName: "Throttle {{delayMs}}ms",
  menuDescription:
    "Limits the number of times a value is emitted to once per time configured. Supports both static and dynamic intervals.",
  description: (config) => {
    return `Throttles input values with an interval of ${timeToString(
      config.delayMs
    )}.`;
  },
  inputs: {
    value: { description: "Value to throttle", mode: "reactive" },
    delayMs: {
      defaultValue: 420,
      description: "Throttle interval in milliseconds",
      editorType: "number",
      editorTypeData: { min: 0 },
    },
  },
  outputs: {
    unthrottledValue: { description: "Unthrottled value" },
  },
  completionOutputs: [],
  run: async (inputs, outputs, adv) => {
    const { unthrottledValue } = outputs;
    const { value, delayMs } = inputs;

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
