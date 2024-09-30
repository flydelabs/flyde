import { macroConfigurableValue, MacroConfigurableValue } from "@flyde/core";
import {
  improvedMacroToOldMacro,
  ImprovedMacroNode,
} from "../ImprovedMacros/improvedMacros";

export interface SpreadListConfig {
  count: MacroConfigurableValue;
}

const spreadList: ImprovedMacroNode<SpreadListConfig> = {
  id: "SpreadList",
  namespace: "Lists",
  menuDisplayName: "Spread List",
  defaultConfig: {
    count: macroConfigurableValue("number", 3),
  },
  menuDescription: "Receives an array and emits its values as separate outputs",
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
      Array.from({ length: config.count.value }, (_, i) => [`item${i + 1}`, {}])
    ),
  run: (inputs, outputs, adv) => {
    const { count } = adv.context.config;
    const { list } = inputs;
    for (let i = 0; i < count; i++) {
      outputs[`item${i + 1}`].next(list[i]);
    }
  },
  configEditor: {
    type: "structured",
    fields: [
      {
        configKey: "count",
        label: "Count",
        type: "number",
        typeConfigurable: false,
      },
    ],
  },
};

export const SpreadList = improvedMacroToOldMacro(spreadList);
