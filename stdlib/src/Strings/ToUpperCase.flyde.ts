import { CodeNode } from "@flyde/core";

const namespace = "Strings";

export const ToUpperCase: CodeNode = {
  id: "To Upper Case",
  defaultStyle: { icon: "fa-font" },
  namespace,
  description: "Converts a string to upper case",
  inputs: { string: { description: "String to convert to upper case" } },
  outputs: { value: { description: "Converted value" } },
  run: ({ string }, { value }) => value.next(string.toUpperCase()),
};
