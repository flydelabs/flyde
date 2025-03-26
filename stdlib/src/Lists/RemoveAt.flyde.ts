import { InternalCodeNode } from "@flyde/core";

const namespace = "Lists";

export const RemoveAt: InternalCodeNode = {
  id: "Remove Item At",
  namespace,
  description: "Removes an item from a list at the specified index",
  inputs: {
    list: { description: "The list" },
    index: { description: "The index of the item to remove" },
  },
  outputs: { list: { description: "The resulting list" } },
  run: ({ list, index }, { list: outputList }) => {
    outputList.next(list.filter((_, idx) => idx !== index));
  },
  icon: "fa-times",
};
