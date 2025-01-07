import { CodeNode } from "@flyde/core";

const namespace = "Lists";

export const Remove: CodeNode = {
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
  defaultStyle: {
    icon: "fa-minus",
  },
};
