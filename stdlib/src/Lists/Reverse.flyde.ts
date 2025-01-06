import { CodeNode } from "@flyde/core";

const namespace = "Lists";

export const Reverse: CodeNode = {
  id: "Reverse",
  defaultStyle: {
    icon: "fa-list",
  },
  namespace,
  description: "Reverses a list",
  inputs: { list: { description: "List" } },
  outputs: { reversed: { description: "Reversed list" } },
  run: ({ list }, { reversed }) => reversed.next(list.reverse()),
};
