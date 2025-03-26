import { InternalCodeNode } from "@flyde/core";

const namespace = "Lists";

export const Reverse: InternalCodeNode = {
  id: "Reverse",
  icon: "fa-list",
  namespace,
  description: "Reverses a list",
  inputs: { list: { description: "List" } },
  outputs: { reversed: { description: "Reversed list" } },
  run: ({ list }, { reversed }) => reversed.next(list.reverse()),
};
