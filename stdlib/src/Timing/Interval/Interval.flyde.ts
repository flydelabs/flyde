import { MacroNode, InputPinMap } from "@flyde/core";
import { TIMING_NAMESPACE, timeToString } from "../common";
import { ConfigurableInput } from "../../lib/ConfigurableInput";

export type IntervalConfig = {
  time: ConfigurableInput<{ timeMs: number }>;
  value: ConfigurableInput<{ jsonValue: any }>;
};

export const Interval: MacroNode<IntervalConfig> = {
  id: "Interval",
  displayName: "Interval",
  namespace: TIMING_NAMESPACE,

  defaultData: {
    time: { mode: "static", timeMs: 1000 },
    value: { mode: "static", jsonValue: "" },
  },
  description:
    "Emits a value every interval. Supports both static and dynamic intervals.",
  definitionBuilder: (config) => {
    const inputs: InputPinMap = {};

    if (config.value.mode === "dynamic") {
      inputs.value = { description: "Value to emit" };
    }

    if (config.time.mode === "dynamic") {
      inputs.interval = { description: "Interval in milliseconds" };
    }

    const displayName = (() => {
      const value =
        config.value.mode === "dynamic"
          ? "a value"
          : JSON.stringify(config.value.jsonValue);
      if (config.time.mode === "static") {
        return `Emit ${value} each ${timeToString(config.time.timeMs)}`;
      } else {
        return "Interval";
      }
    })();

    return {
      inputs,
      displayName,
      outputs: {
        value: { description: "Emitted value" },
      },
      reactiveInputs:
        config.time.mode === "dynamic" ? ["value", "interval"] : ["value"],
      completionOutputs: [],
      description: "Emits a value every interval.",
    };
  },
  runFnBuilder: (config) => {
    return ({ value: _value, interval }, outputs, adv) => {
      const intervalValue =
        config.time.mode === "dynamic" ? interval : config.time.timeMs;

      const value =
        config.value.mode === "dynamic" ? _value : config.value.jsonValue;

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
  editorComponentBundlePath: "../../../../dist/ui/Interval.js",
};
