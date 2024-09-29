import { macro2toMacro, MacroNodeV2 } from "../ImprovedMacros/improvedMacros";

export interface SpreadListConfig {
  count: number;
}

const spreadList: MacroNodeV2<SpreadListConfig> = {
  id: "SpreadList",
  namespace: "Lists",
  menuDisplayName: "Spread List",
  defaultConfig: {
    count: 3,
  },
  menuDescription: "Spreads a list into multiple outputs",
  displayName: (config) => `Spreads List of ${config.count}`,
  description: (config) =>
    `Receives a list with ${config.count} items and emits ${config.count} outputs: the first item, the second item, and so on`,
  defaultStyle: {
    icon: "sitemap",
  },
  inputs: {
    list: { description: "The list" },
  },
  outputs: (config) =>
    Object.fromEntries(
      Array.from({ length: config.count }, (_, i) => [`item${i + 1}`, {}])
    ),
  run: (inputs, outputs, adv) => {
    const { count } = adv.context.config;
    const { list } = inputs;
    for (let i = 0; i < count; i++) {
      outputs[`item${i + 1}`].next(list[i]);
    }
  },
};

export const SpreadList = macro2toMacro(spreadList);
