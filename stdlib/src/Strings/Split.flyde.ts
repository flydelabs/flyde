import { CodeNode } from "@flyde/core";

export const Split: CodeNode = {
  id: "Split",
  icon: "fa-font",
  description: "Splits a string",
  inputs: {
    string: { description: "String to split" },
    separator: { description: "Separator" },
  },
  outputs: { value: { description: "Splitted value" } },
  run: ({ string, separator }, { value }) =>
    value.next(string.split(separator)),
};
