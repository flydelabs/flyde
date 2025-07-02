import { configurableValue, ConfigurableValue } from "@flyde/core";
import { CodeNode } from "@flyde/core";

export interface SpreadListConfig {
  count: ConfigurableValue;
}

export const SpreadList: CodeNode<SpreadListConfig> = {
  id: "SpreadList",
  namespace: "Lists",
  mode: "advanced",
  menuDisplayName: "Spread List",
  defaultConfig: {
    count: configurableValue("number", 3),
  },
  menuDescription: "Receives an array and emits its values as separate outputs",
  displayName: (config) => `Spreads List of ${config.count}`,
  description: (config) =>
    `Receives a list with ${config.count} items and emits ${config.count} outputs: the first item, the second item, and so on`,
  icon: "sitemap",
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
  editorConfig: {
    type: "structured",
    fields: [
      {
        configKey: "count",
        label: "Count",
        type: "number",
        typeConfigurable: false,
        typeData: {
          min: 1,
          max: 7
        },
      },
    ],
  },
};
