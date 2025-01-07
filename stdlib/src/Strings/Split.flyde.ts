import { CodeNode } from "@flyde/core";

const namespace = "Strings";

export const Split: CodeNode = {
  id: "Split",
  defaultStyle: { icon: "fa-font" },
  namespace,
  description: "Splits a string",
  inputs: {
    string: { description: "String to split" },
    separator: { description: "Separator" },
  },
  outputs: { value: { description: "Splitted value" } },
  run: ({ string, separator }, { value }) =>
    value.next(string.split(separator)),
};
