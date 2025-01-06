import { CodeNode } from "@flyde/core";

const namespace = "Lists";

export const ListLength: CodeNode = {
  id: "List Length",
  defaultStyle: {
    icon: "fa-list",
  },
  namespace,
  description: "Returns the length of a list",
  inputs: { list: { description: "List" } },
  outputs: { length: { description: "Length" } },
  run: ({ list }, { length }) => length.next(list.length),
};
