import { InternalCodeNode } from "@flyde/core";

const namespace = "Numbers";
export const Max: InternalCodeNode = {
  id: "Max",
  namespace,
  description: "Emits the maximum of two numbers",
  inputs: {
    n1: { description: "First number" },
    n2: { description: "Second number" },
  },
  outputs: { max: { description: "The maximum of n1 and n2" } },
  run: ({ n1, n2 }, { max }) => max.next(Math.max(n1, n2)),
};
