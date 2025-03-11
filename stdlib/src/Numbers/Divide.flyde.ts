import { InternalCodeNode } from "@flyde/core";

const namespace = "Numbers";
export const Divide: InternalCodeNode = {
  id: "Divide",
  defaultStyle: {
    icon: "fa-divide",
  },
  namespace,
  description: "Emits the quotient of two numbers",
  inputs: {
    n1: { description: "First number to divide" },
    n2: { description: "Second number to divide" },
  },
  outputs: { quotient: { description: "The quotient of n1 and n2" } },
  run: ({ n1, n2 }, { quotient }) => quotient.next(n1 / n2),
};
