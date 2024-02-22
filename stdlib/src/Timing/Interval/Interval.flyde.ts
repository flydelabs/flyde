import { MacroNode, InputPinMap, ConfigurableInput } from "@flyde/core";
import { TIMING_NAMESPACE, timeToString } from "../common";

export type IntervalConfig = {
  time: ConfigurableInput<number>;
  value: ConfigurableInput<any>;
};

export const Interval: MacroNode<IntervalConfig> = {
  id: "Interval",
  displayName: "Interval",
  namespace: TIMING_NAMESPACE,
  defaultStyle: {
    icon: "stopwatch",
  },

  defaultData: {
    time: { mode: "static", value: 1000 },
    value: { mode: "static", value: "" },
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
          : JSON.stringify(config.value.value);
      if (config.time.mode === "static") {
        return `Emit ${value} each ${timeToString(config.time.value)}`;
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
        config.time.mode === "dynamic" ? interval : config.time.value;

      const value =
        config.value.mode === "dynamic" ? _value : config.value.value;

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
  editorConfig: {
    type: "structured",
    fields: [
      {
        type: {
          value: "number",
        },
        configKey: "time",
        label: "Interval",
        defaultValue: 1000,
        allowDynamic: true,
      },
      {
        type: {
          value: "json",
          label: "Any JSON value:",
        },
        configKey: "value",
        label: "Value",
        defaultValue: "",
        allowDynamic: true,
      },
    ],
  },
};
