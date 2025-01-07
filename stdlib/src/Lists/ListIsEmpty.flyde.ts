import { CodeNode } from "@flyde/core";

const namespace = "Lists";

export const ListIsEmpty: CodeNode = {
  id: "List Is Empty",
  defaultStyle: {
    icon: "fa-list",
  },
  namespace,
  description: "Returns true if the list is empty",
  inputs: { list: { description: "List" } },
  outputs: { isEmpty: { description: "Is empty" } },
  run: ({ list }, { isEmpty }) => isEmpty.next(list.length === 0),
};
