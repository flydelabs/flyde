import { InternalCodeNode } from "@flyde/core";

const namespace = "Numbers";
export const Add: InternalCodeNode = {
  id: "Add",
  defaultStyle: {
    icon: "fa-plus",
  },
  namespace,
  description: "Emits the sum of two numbers",
  inputs: {
    n1: { description: "First number to add" },
    n2: { description: "Second number to add" },
  },
  outputs: { sum: { description: "The sum of n1 and n2" } },
  run: ({ n1, n2 }, { sum }) => sum.next(n1 + n2),
};
