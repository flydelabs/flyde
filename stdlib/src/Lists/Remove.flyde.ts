import { InternalCodeNode } from "@flyde/core";

const namespace = "Lists";

export const Remove: InternalCodeNode = {
  id: "Remove Item",
  namespace,
  description: "Removes an item from a list",
  inputs: {
    list: { description: "The list" },
    item: { description: "The item to remove" },
  },
  outputs: { list: { description: "The resulting list" } },
  run: ({ list, item }, { list: outputList }) => {
    outputList.next(list.filter((i) => i !== item));
  },
  icon: "fa-minus",
};
