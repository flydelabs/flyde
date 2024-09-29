import { OutputPin } from "@flyde/core";
import { macro2toMacro, MacroNodeV2 } from "../ImprovedMacros/improvedMacros";

const namespace = "Control Flow";

export interface RoundRobinConfig {
  count: number;
}

const roundRobin: MacroNodeV2<RoundRobinConfig> = {
  id: "RoundRobin",
  defaultConfig: { count: 3 },
  namespace,
  menuDisplayName: "Round Robin",
  menuDescription:
    "Item will be emitted to one of the outputs in a round robin fashion",
  defaultStyle: {
    icon: "rotate",
  },
  inputs: {
    value: { mode: "required", description: "The value to emit" },
  },
  outputs: (config) =>
    Array.from({ length: config.count }).reduce<Record<string, OutputPin>>(
      (obj, _, i) => ({
        ...obj,
        [`r${i + 1}`]: {
          description: `The ${
            i + 1
          } output in order to emit the value received. After emitting a value, it moves to "r${
            (i + 2) % config.count
          }"'s turn.`,
        },
      }),
      {}
    ),
  completionOutputs: [],
  reactiveInputs: ["value"],
  displayName: (config) => `Round Robin ${config.count}`,
  description: (config) =>
    `Item will be emitted to one of the ${config.count} outputs in a round robin fashion`,
  configEditor: {
    type: "structured",
    fields: [
      {
        type: "number",
        configKey: "count",
        label: "Count",
      },
    ],
  },
  run: (inputs, outputs, adv) => {
    const { state } = adv;
    const { count } = adv.context.config;

    const outputKeys = Array.from({ length: count }).map((_, i) => `r${i + 1}`);

    const curr = state.get("curr") || 0;

    const o = outputs[outputKeys[curr]];
    const nextCurr = (curr + 1) % count;

    state.set("curr", nextCurr);
    o.next(inputs.value);
  },
};

export const RoundRobin = macro2toMacro(roundRobin);
