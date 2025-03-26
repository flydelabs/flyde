import { InternalCodeNode } from "@flyde/core";

const namespace = "Lists";

export const ConcatLists: InternalCodeNode = {
  id: "Concat Lists",
  icon: "fa-list",
  namespace,
  description: "Concatenates two lists",
  inputs: {
    list1: { description: "First list" },
    list2: { description: "Second list" },
  },
  outputs: { list: { description: "Concatenated list" } },
  run: ({ list1, list2 }, { list }) => list.next([...list1, ...list2]),
};
