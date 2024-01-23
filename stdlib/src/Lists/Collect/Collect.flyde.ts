import { InputPinMap, MacroNode, isDefined } from "@flyde/core";
import { ConfigurableInput } from "../../lib/ConfigurableInput";
import { timeToString } from "../../Timing/common";

export type CollectConfigTime = {
  strategy: "time";
  time: ConfigurableInput<{ timeMs?: number }>;
};

export type CollectConfigCount = {
  strategy: "count";
  count: ConfigurableInput<{ count?: number }>;
};

export type CollectConfigTrigger = {
  strategy: "trigger";
};

export type CollectConfig =
  | CollectConfigTime
  | CollectConfigCount
  | CollectConfigTrigger;

export const Collect: MacroNode<CollectConfig> = {
  id: "Collect",
  displayName: "Collect",
  description: "Collects values into a list. Over time, count, or trigger.",
  namespace: "Lists",
  defaultData: { strategy: "count", count: { mode: "static", count: 3 } },
  definitionBuilder: (config) => {
    const inputs = {
      value: { description: "Value to collect" },
    } as InputPinMap;

    if (config.strategy === "time" && config.time.mode === "dynamic") {
      inputs.time = { description: "Time in milliseconds" };
    } else if (config.strategy === "count" && config.count.mode === "dynamic") {
      inputs.count = { description: "Number of values to collect" };
    } else if (config.strategy === "trigger") {
      inputs.trigger = {
        mode: "optional",
        description:
          "Emit a value here to output a list out of collected values",
      };
    }

    const displayName = (() => {
      if (config.strategy === "time") {
        if (config.time.mode === "static") {
          return `Collect over ${timeToString(config.time.timeMs)}`;
        } else {
          return "Collect over time";
        }
      } else if (config.strategy === "count") {
        if (config.count.mode === "static") {
          return `Collect ${config.count.count} values`;
        } else {
          return "Collect values";
        }
      } else {
        return "Collect on trigger";
      }
    })();

    const description = (() => {
      if (config.strategy === "time") {
        if (config.time.mode === "static") {
          return `Emits a list of all values received, from the first value and until ${timeToString(
            config.time.timeMs
          )} pass.`;
        } else {
          return "Emits a list of all values received, from the first value and until the specified amount of time passes.";
        }
      } else if (config.strategy === "count") {
        if (config.count.mode === "static") {
          return `Collect ${config.count.count} values and emit a list of them.`;
        } else {
          return "Collect a specified amount of values and emit a list of them.";
        }
      } else {
        return "Emits a list of all values received up until any value is received to the 'trigger' input.";
      }
    })();

    return {
      displayName,
      description,
      inputs,
      reactiveInputs: [
        "value",
        ...(config.strategy === "trigger" ? ["trigger"] : []),
      ],
      outputs: {
        list: { description: "Collected values" },
      },
      completionOutputs: ["list"],
    };
  },
  runFnBuilder: (config) => {
    return async ({ value, time, count, trigger }, outputs, adv) => {
      const list = adv.state.get("list") || [];

      if (isDefined(value)) {
        list.push(value);
        adv.state.set("list", list);
      }

      if (config.strategy === "time") {
        const timeValue =
          config.time.mode === "dynamic" ? time : config.time.timeMs;

        const timer = adv.state.get("timer");
        if (!timer) {
          const newTimer = setTimeout(() => {
            outputs.list.next(list);
            adv.state.set("list", []);
          }, timeValue);

          adv.state.set("timer", newTimer);
        }
      } else if (config.strategy === "count") {
        const countValue =
          config.count.mode === "dynamic" ? count : config.count.count;
        if (list.length >= countValue) {
          outputs.list.next(list);
          adv.state.set("list", []);
        }
      } else if (config.strategy === "trigger") {
        if (isDefined(trigger)) {
          outputs.list.next(list);
          adv.state.set("list", []);
        }
      }
    };
  },
  editorComponentBundlePath: "../../../../dist/ui/Collect.js",
};
