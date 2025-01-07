import { CodeNode } from "@flyde/core";

const namespace = "Numbers";
export const GreaterThanOrEqual: CodeNode = {
  id: "Greater Than Or Equal",
  namespace,
  description:
    "Emits true if the first number is greater than or equal to the second",
  inputs: {
    n1: { description: "First number" },
    n2: { description: "Second number" },
  },
  outputs: {
    result: { description: "true if n1 is greater than or equal to n2" },
  },
  run: ({ n1, n2 }, { result }) => result.next(n1 >= n2),
};
