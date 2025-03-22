import { CodeNode } from "@flyde/core";

export const Concat: CodeNode = {
  id: "Concat",
  description: "Concatenate two strings",
  inputs: {
    a: {
      description: "The first string",
    },
    b: {
      description: "The second string",
    },
  },
  outputs: {
    value: {
      description: "The concatenated string",
    },
  },
  run: (inputs, { value }) => {
    value.next(inputs.a + inputs.b);
  },
};
