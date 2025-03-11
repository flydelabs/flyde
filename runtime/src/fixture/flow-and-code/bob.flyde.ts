import { InternalCodeNode } from "@flyde/core";

export const Bob: InternalCodeNode = {
  id: "Bob",
  inputs: {},
  outputs: { r: {} },
  run: (_, { r }) => {
    r.next("Bob");
  },
};
