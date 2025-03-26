import { InternalCodeNode } from "@flyde/core";

const namespace = "Lists";

export const ListIsEmpty: InternalCodeNode = {
  id: "List Is Empty",
  icon: "fa-list",
  namespace,
  description: "Returns true if the list is empty",
  inputs: { list: { description: "List" } },
  outputs: { isEmpty: { description: "Is empty" } },
  run: ({ list }, { isEmpty }) => isEmpty.next(list.length === 0),
};
