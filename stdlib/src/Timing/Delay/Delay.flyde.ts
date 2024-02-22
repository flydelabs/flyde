import { MacroNode, InputPinMap, ConfigurableInput } from "@flyde/core";
import { timeToString } from "../common";

export type DelayConfig = ConfigurableInput<number>;

export const Delay: MacroNode<{ delayMs: DelayConfig }> = {
  id: "Delay",
  displayName: "Delay",
  namespace: "Timing",
  defaultStyle: {
    icon: "clock",
  },
  defaultData: { delayMs: { mode: "static", value: 420 } },
  description:
    "Delays a value by a given amount of time. Supports both static and dynamic delays.",
  definitionBuilder: ({ delayMs }) => {
    const inputs: InputPinMap = { value: { description: "Value to delay" } };

    if (delayMs.mode === "dynamic") {
      inputs.delay = { description: "Delay in milliseconds" };
    }

    const displayName =
      delayMs.mode === "dynamic"
        ? "Delay"
        : `Delay ${timeToString(delayMs.value)}`;

    return {
      inputs,
      displayName,
      description: `Delays a value by ${
        delayMs.mode === "static"
          ? timeToString(delayMs.value)
          : "a dynamic amount of time"
      }.`,
      outputs: {
        delayedValue: { description: "Delayed value" },
      },
      completionOutputs: ["delayedValue"],
    };
  },
  runFnBuilder: ({ delayMs }) => {
    return async ({ value, delay }, outputs) => {
      const delayValue = delayMs.mode === "dynamic" ? delay : delayMs.value;
      await new Promise((resolve) => setTimeout(resolve, delayValue));
      outputs.delayedValue.next(value);
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
        label: "Delay (ms)",
        defaultValue: 420,
        allowDynamic: true,
      },
    ],
  },
};
