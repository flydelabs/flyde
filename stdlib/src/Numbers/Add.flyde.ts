import { CodeNode } from "@flyde/core";

// for backwards compatibility
export const Add: CodeNode = {
  id: "Add",
  description: "Add two numbers",
  inputs: {
    n1: {},
    n2: {},
  },
  outputs: {
    sum: {
      description: "The sum of the two numbers",
    },
  },
  run: (inputs, { sum }) => {
    sum.next(inputs.n1 + inputs.n2);
  },
};
