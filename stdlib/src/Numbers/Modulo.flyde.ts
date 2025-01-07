import { CodeNode } from "@flyde/core";

const namespace = "Numbers";
export const Modulo: CodeNode = {
  id: "Modulo",
  defaultStyle: {
    icon: "fa-percentage",
  },
  namespace,
  description: "Emits the remainder of two numbers",
  inputs: {
    n1: { description: "First number to divide" },
    n2: { description: "Second number to divide" },
  },
  outputs: { remainder: { description: "The remainder of n1 and n2" } },
  run: ({ n1, n2 }, { remainder }) => remainder.next(n1 % n2),
};
