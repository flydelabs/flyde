import { InternalCodeNode } from "@flyde/core";

const namespace = "Lists";

export const LoopList: InternalCodeNode = {
  id: "Loop List",
  icon: "fa-list",
  namespace,
  aliases: ["each", "spread"],
  description: "Emits all values in a list",
  inputs: {
    list: { description: "The list to loop" },
  },
  outputs: {
    item: { description: "Will emit a value for each item in the list" },
    index: { description: "Will emit the index of the item" },
    length: { description: "Will emit the length of the list" },
  },
  run: (inputs, outputs) => {
    const { list } = inputs;
    const { item, index } = outputs;
    for (const i of list) {
      item.next(i);
      index.next(list.indexOf(i));
    }
    outputs.length.next(list.length);
  },
};
