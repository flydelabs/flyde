import { MacroNodeV2, macro2toMacro } from "../ImprovedMacros/improvedMacros";

export interface ListFromConfig {
  count: number;
}

const listFrom: MacroNodeV2<ListFromConfig> = {
  id: "ListFrom",
  namespace: "Lists",
  menuDisplayName: "List From",
  defaultConfig: {
    count: 3,
  },
  menuDescription: "Creates a list from a specified number of values",
  displayName: (config) => `List from ${config.count}`,
  description: (config) => `Creates a list from ${config.count} values`,
  defaultStyle: {
    icon: "list",
  },
  inputs: (config) =>
    Object.fromEntries(
      Array.from({ length: config.count }, (_, i) => [`item${i + 1}`, {}])
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
};

export const ListFrom = macro2toMacro(listFrom);
