import { MacroNode } from "@flyde/core";

export const ListFrom: MacroNode<{ count: number }> = {
  id: "ListFrom",
  namespace: "Lists",
  runFnBuilder:
    ({ count }) =>
    (inputs, { list }) => {
      const result = [];
      for (let i = 0; i < count; i++) {
        result.push(inputs[`item${i + 1}`]);
      }
      return list.next(result);
    },
  definitionBuilder: ({ count }) => ({
    description: `Creates a list from ${count} values`,
    displayName: `List from ${count}`,
    inputs: Object.fromEntries(
      Array.from({ length: count }, (_, i) => [`item${i + 1}`, {}])
    ),
    outputs: { list: { description: "List containing all values" } },
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
