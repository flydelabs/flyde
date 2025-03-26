import { InternalCodeNode } from "@flyde/core";

const namespace = "Lists";

export const Prepend: InternalCodeNode = {
  id: "Prepend",
  namespace,
  description: "Prepends an item to a list",
  inputs: {
    list: { description: "The list" },
    item: { description: "The item to prepend" },
  },
  outputs: { list: { description: "The resulting list" } },
  run: ({ list, item }, { list: outputList }) => {
    outputList.next([item, ...list]);
  },
  icon: "fa-arrow-up",
};
