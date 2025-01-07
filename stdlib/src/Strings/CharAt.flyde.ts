import { CodeNode } from "@flyde/core";

const namespace = "Strings";

export const CharAt: CodeNode = {
  id: "Char At",
  defaultStyle: { icon: "fa-font" },
  namespace,
  description: "Returns the character at the specified index",
  inputs: {
    string: { description: "String to get character from" },
    index: { description: "Index to get character from" },
  },
  outputs: { value: { description: "Character" } },
  run: ({ string, index }, { value }) => value.next(string.charAt(index)),
};
