import { InternalCodeNode } from "@flyde/core";

const namespace = "Strings";

export const LastIndexOf: InternalCodeNode = {
  id: "Last Index Of",
  defaultStyle: { icon: "fa-font" },
  namespace,
  description:
    "Returns the index within the calling String object of the last occurrence of the specified value, or -1 if not found. The calling string is searched backward, starting at fromIndex",
  inputs: {
    string: { description: "String to search in" },
    searchValue: { description: "Value to search for" },
    fromIndex: { description: "Index to start searching from" },
  },
  outputs: { value: { description: "Index" } },
  run: ({ string, searchValue, fromIndex }, { value }) =>
    value.next(string.lastIndexOf(searchValue, fromIndex)),
};
