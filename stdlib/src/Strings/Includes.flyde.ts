import { CodeNode } from "@flyde/core";

const namespace = "Strings";

export const Includes: CodeNode = {
  id: "Includes",
  namespace,
  defaultStyle: { icon: "fa-font" },
  description:
    "Determines whether one string may be found within another string, returning true or false as appropriate",
  inputs: {
    string: { description: "String to search in" },
    searchValue: { description: "Value to search for" },
    fromIndex: { description: "Index to start searching from" },
  },
  outputs: { value: { description: "Result" } },
  run: ({ string, searchValue, fromIndex }, { value }) =>
    value.next(string.includes(searchValue, fromIndex)),
};
