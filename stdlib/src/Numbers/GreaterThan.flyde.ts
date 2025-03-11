import { InternalCodeNode } from "@flyde/core";

const namespace = "Numbers";
export const GreaterThan: InternalCodeNode = {
  id: "Greater Than",
  namespace,
  description: "Emits true if the first number is greater than the second",
  inputs: {
    n1: { description: "First number" },
    n2: { description: "Second number" },
  },
  outputs: { result: { description: "true if n1 is greater than n2" } },
  run: ({ n1, n2 }, { result }) => result.next(n1 > n2),
};
