import { CodeNode } from "@flyde/core";

const namespace = "Strings";

export const Replace: CodeNode = {
  id: "Replace",
  defaultStyle: { icon: "fa-font" },
  namespace,
  description: "Replaces a string",
  inputs: {
    string: { description: "String to replace" },
    searchValue: { description: "Value to search for" },
    replaceValue: { description: "Value to replace with" },
  },
  outputs: { value: { description: "Replaced value" } },
  run: ({ string, searchValue, replaceValue }, { value }) =>
    value.next(string.replace(searchValue, replaceValue)),
};
