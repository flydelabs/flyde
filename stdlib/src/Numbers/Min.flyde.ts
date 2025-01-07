import { CodeNode } from "@flyde/core";

const namespace = "Numbers";
export const Min: CodeNode = {
  id: "Min",
  namespace,
  description: "Emits the minimum of two numbers",
  inputs: {
    n1: { description: "First number" },
    n2: { description: "Second number" },
  },
  outputs: { min: { description: "The minimum of n1 and n2" } },
  run: ({ n1, n2 }, { min }) => min.next(Math.min(n1, n2)),
};
