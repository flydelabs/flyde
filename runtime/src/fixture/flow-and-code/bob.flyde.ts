import { CodePart } from "@flyde/core";

export const Bob: CodePart = {
  id: "Bob",
  inputs: {},
  outputs: { r: {} },
  run: (_, { r }) => {
    r.next("Bob");
  },
};
