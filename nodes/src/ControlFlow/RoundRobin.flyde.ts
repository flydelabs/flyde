import {
  configurableValue,
  ConfigurableValue,
  OutputPin,
} from "@flyde/core";
import { CodeNode } from "@flyde/core";

const namespace = "Control Flow";

export interface RoundRobinConfig {
  count: ConfigurableValue;
}

export const RoundRobin: CodeNode<RoundRobinConfig> = {
  mode: "advanced",
  id: "RoundRobin",
  defaultConfig: { count: configurableValue("number", 3) },
  namespace,
  menuDisplayName: "Round Robin",
  menuDescription:
    "Item will be emitted to one of the outputs in a round robin fashion",
  icon: "rotate",

  inputs: {
    value: { mode: "required", description: "The value to emit" },
  },
  outputs: (config) =>
    Array.from({ length: config.count.value }).reduce<
      Record<string, OutputPin>
    >(
      (obj, _, i) => ({
        ...obj,
        [`r${i + 1}`]: {
          description: `The ${i + 1
            } output in order to emit the value received. After emitting a value, it moves to "r${(i + 2) % config.count.value
            }"'s turn.`,
        },
      }),
      {}
    ),
  completionOutputs: [],
  reactiveInputs: ["value"],
  displayName: (config) => `Round Robin ${config.count.value}`,
  description: (config) =>
    `Item will be emitted to one of the ${config.count.value} outputs in a round robin fashion`,
  editorConfig: {
    type: "structured",
    fields: [
      {
        type: "number",
        configKey: "count",
        label: "Count",
        // typeConfigurable: false,
      },
    ],
  },
  run: (inputs, outputs, adv) => {
    const { state } = adv;
    const { count } = adv.context.config;

    const outputKeys = Array.from({ length: count.value }).map(
      (_, i) => `r${i + 1}`
    );

    const curr = state.get("curr") || 0;

    const o = outputs[outputKeys[curr]];
    const nextCurr = (curr + 1) % count.value;

    state.set("curr", nextCurr);
    o.next(inputs.value);
  },
};
