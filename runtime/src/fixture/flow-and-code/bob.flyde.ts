import { CodeNode } from "@flyde/core";

export const Bob: CodeNode = {
  id: "Bob",
  inputs: {},
  outputs: { r: {} },
  run: (_, { r }) => {
    r.next("Bob");
  },
};
