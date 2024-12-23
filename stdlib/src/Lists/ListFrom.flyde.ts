import { macroConfigurableValue, MacroConfigurableValue } from "@flyde/core";
import { processImprovedMacro, ImprovedMacroNode } from "@flyde/core";

export interface ListFromConfig {
  count: MacroConfigurableValue;
}

const listFrom: ImprovedMacroNode<ListFromConfig> = {
  id: "ListFrom",
  namespace: "Lists",
  menuDisplayName: "Merge to List",
  defaultConfig: {
    count: macroConfigurableValue("number", 2),
  },
  menuDescription:
    "Receives a list of values and creates a list (array) from them",
  displayName: (config) => `List from ${config.count}`,
  description: (config) => `Creates a list from ${config.count} values`,
  defaultStyle: {
    icon: "list",
  },
  inputs: (config) =>
    Object.fromEntries(
      Array.from({ length: config.count.value }, (_, i) => [`item${i + 1}`, {}])
    ),
  outputs: {
    list: { description: "List containing all values" },
  },
  run: (inputs, outputs, adv) => {
    const { count } = adv.context.config;
    const result = [];
    for (let i = 0; i < count; i++) {
      result.push(inputs[`item${i + 1}`]);
    }
    outputs.list.next(result);
  },
  editorConfig: {
    type: "structured",
    fields: [
      {
        type: "number",
        label: "Count",
        description: "Number of items to create",
        configKey: "count",
        typeConfigurable: false,
      },
    ],
  },
};

export const ListFrom = processImprovedMacro(listFrom);
