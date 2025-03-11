import { InternalCodeNode } from "@flyde/core";

const namespace = "Strings";

export const ToLowerCase: InternalCodeNode = {
  id: "To Lower Case",
  defaultStyle: { icon: "fa-font" },
  namespace,
  description: "Converts a string to lower case",
  inputs: { string: { description: "String to convert to lower case" } },
  outputs: { value: { description: "Converted value" } },
  run: ({ string }, { value }) => value.next(string.toLowerCase()),
};
