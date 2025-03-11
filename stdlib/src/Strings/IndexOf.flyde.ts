import { InternalCodeNode } from "@flyde/core";

const namespace = "Strings";

export const IndexOf: InternalCodeNode = {
  id: "Index Of",
  defaultStyle: { icon: "fa-font" },
  namespace,
  description:
    "Returns the index within the calling String object of the first occurrence of the specified value, starting the search at fromIndex",
  inputs: {
    string: { description: "String to search in" },
    searchValue: { description: "Value to search for" },
    fromIndex: { description: "Index to start searching from" },
  },
  outputs: { value: { description: "Index" } },
  run: ({ string, searchValue, fromIndex }, { value }) =>
    value.next(string.indexOf(searchValue, fromIndex)),
};
