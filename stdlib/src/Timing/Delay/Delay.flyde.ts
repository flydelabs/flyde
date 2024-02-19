import { MacroNode, InputPinMap } from "@flyde/core";
import { timeToString } from "../common";
import { ConfigurableInput } from "../../lib/ConfigurableInput";

export type DelayConfig = ConfigurableInput<{ timeMs?: number }>;

export const Delay: MacroNode<DelayConfig> = {
  id: "Delay",
  displayName: "Delay",
  namespace: "Timing",
  defaultData: { mode: "static", timeMs: 420 },
  description:
    "Delays a value by a given amount of time. Supports both static and dynamic delays.",
  definitionBuilder: (config) => {
    const inputs: InputPinMap = { value: { description: "Value to delay" } };

    if (config.mode === "dynamic") {
      inputs.delay = { description: "Delay in milliseconds" };
    }

    const displayName =
      config.mode === "dynamic"
        ? "Delay"
        : `Delay ${timeToString(config.timeMs)}`;

    return {
      inputs,
      displayName,
      description: `Delays a value by ${
        config.mode === "static"
          ? timeToString(config.timeMs)
          : "a dynamic amount of time"
      }.`,
      outputs: {
        delayedValue: { description: "Delayed value" },
      },
      completionOutputs: ["delayedValue"],
    };
  },
  runFnBuilder: (config) => {
    return async ({ value, delay }, outputs) => {
      const delayValue = config.mode === "dynamic" ? delay : config.timeMs;
      await new Promise((resolve) => setTimeout(resolve, delayValue));
      outputs.delayedValue.next(value);
    };
  },
  editorConfig: {
    type: "custom",
    editorComponentBundlePath: "../../../../dist/ui/Delay.js",
  },
};
