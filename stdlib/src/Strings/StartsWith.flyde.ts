import { InternalCodeNode } from "@flyde/core";

const namespace = "Strings";

export const StartsWith: InternalCodeNode = {
  id: "Starts With",
  namespace,
  defaultStyle: { icon: "fa-font" },
  description:
    "Determines whether a string begins with the characters of another string, returning true or false as appropriate",
  inputs: {
    string: { description: "String to search in" },
    searchValue: { description: "Value to search for" },
    fromIndex: { description: "Index to start searching from" },
  },
  outputs: { value: { description: "Result" } },
  run: ({ string, searchValue, fromIndex }, { value }) =>
    value.next(string.startsWith(searchValue, fromIndex)),
};
