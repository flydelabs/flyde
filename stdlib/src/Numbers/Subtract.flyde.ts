import { InternalCodeNode } from "@flyde/core";

const namespace = "Numbers";
export const Subtract: InternalCodeNode = {
  id: "Subtract",
  defaultStyle: {
    icon: "fa-minus",
  },
  namespace,
  description: "Emits the difference of two numbers",
  inputs: {
    n1: { description: "First number to subtract" },
    n2: { description: "Second number to subtract" },
  },
  outputs: { difference: { description: "The difference of n1 and n2" } },
  run: ({ n1, n2 }, { difference }) => difference.next(n1 - n2),
};
