import { InternalCodeNode } from "@flyde/core";

const namespace = "Lists";

export const HeadAndRest: InternalCodeNode = {
  id: "Head and rest",
  icon: "fa-list",
  namespace,
  description:
    "Receives a list and emits two outputs: the first item and the rest of the list",
  inputs: {
    list: { description: "The list" },
  },
  outputs: {
    head: { description: "The first item in the list" },
    rest: { description: "The rest of the list" },
  },
  run: (inputs, outputs) => {
    const { list } = inputs;
    const { head, rest } = outputs;
    head.next(list[0]);
    rest.next(list.slice(1));
  },
};
