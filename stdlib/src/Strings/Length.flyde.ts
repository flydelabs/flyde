import { CodeNode } from "@flyde/core";

const namespace = "Strings";

export const Length: CodeNode = {
  id: "Length",
  defaultStyle: { icon: "fa-font" },
  namespace,
  description: "Returns the length of a string",
  inputs: { string: { description: "String to get length from" } },
  outputs: { value: { description: "Length" } },
  run: ({ string }, { value }) => value.next(string.length),
};
