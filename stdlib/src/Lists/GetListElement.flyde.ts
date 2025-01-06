import { CodeNode } from "@flyde/core";

const namespace = "Lists";

export const GetListElement: CodeNode = {
  id: "Get List Element",
  defaultStyle: {
    icon: "fa-list",
  },
  namespace,
  description: "Returns the element at the specified index",
  inputs: {
    list: { description: "List" },
    index: { description: "Index" },
  },
  outputs: { element: { description: "Element" } },
  run: ({ list, index }, { element }) => element.next(list[index]),
};
