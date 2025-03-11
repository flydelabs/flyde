import { InternalCodeNode } from "@flyde/core";

const namespace = "Strings";

export const IsEmpty: InternalCodeNode = {
  id: "Is Empty",
  namespace,
  defaultStyle: { icon: "fa-font" },
  description: "Determines whether a string is empty",
  inputs: { string: { description: "String to check" } },
  outputs: { value: { description: "Result" } },
  run: ({ string }, { value }) => value.next(string.length === 0),
};
