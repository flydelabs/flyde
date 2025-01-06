import { CodeNode } from "@flyde/core";

const namespace = "Numbers";
export const Multiply: CodeNode = {
  id: "Multiply",
  defaultStyle: {
    icon: "fa-times",
  },
  namespace,
  description: "Emits the product of two numbers",
  inputs: {
    n1: { description: "First number to multiply" },
    n2: { description: "Second number to multiply" },
  },
  outputs: { product: { description: "The product of n1 and n2" } },
  run: ({ n1, n2 }, { product }) => product.next(n1 * n2),
};
