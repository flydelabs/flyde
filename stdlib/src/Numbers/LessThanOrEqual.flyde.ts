import { InternalCodeNode } from "@flyde/core";

const namespace = "Numbers";
export const LessThanOrEqual: InternalCodeNode = {
  id: "Less Than Or Equal",
  namespace,
  description:
    "Emits true if the first number is less than or equal to the second",
  inputs: {
    n1: { description: "First number" },
    n2: { description: "Second number" },
  },
  outputs: {
    result: { description: "true if n1 is less than or equal to n2" },
  },
  run: ({ n1, n2 }, { result }) => result.next(n1 <= n2),
};
