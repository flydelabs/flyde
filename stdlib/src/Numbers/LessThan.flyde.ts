import { InternalCodeNode } from "@flyde/core";

const namespace = "Numbers";
export const LessThan: InternalCodeNode = {
  id: "Less Than",
  namespace,
  description: "Emits true if the first number is less than the second",
  inputs: {
    n1: { description: "First number" },
    n2: { description: "Second number" },
  },
  outputs: { result: { description: "true if n1 is less than n2" } },
  run: ({ n1, n2 }, { result }) => result.next(n1 < n2),
};
