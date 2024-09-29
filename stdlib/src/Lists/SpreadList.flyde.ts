import { MacroNode } from "@flyde/core";

export const SpreadList: MacroNode<{ count: number }> = {
  id: "SpreadList",
  namespace: "Lists",
  defaultStyle: {
    icon: "sitemap",
  },
  displayName: "Spread List",
  description: "Spreads a list into multiple outputs",
  runFnBuilder:
    ({ count }) =>
    (inputs, outputs) => {
      const { list } = inputs;
      for (let i = 0; i < count; i++) {
        outputs[`item${i + 1}`].next(list[i]);
      }
    },
  definitionBuilder: ({ count }) => ({
    description: `Receives a list with ${count} items and emits ${count} outputs: the first item, the second item, and so on`,
    displayName: `Spreads List of ${count}`,
    inputs: { list: { description: "The list" } },
    outputs: Object.fromEntries(
      Array.from({ length: count }, (_, i) => [`item${i + 1}`, {}])
    ),
  }),
  defaultData: { count: 3 },
  editorConfig: {
    type: "structured",
    fields: [
      {
        type: "number",
        configKey: "count",
        label: "Count",
      },
    ],
  },
};
