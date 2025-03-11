import { InternalCodeNode } from "@flyde/core";

const namespace = "Strings";

export const ToSnakeCase: InternalCodeNode = {
  id: "To Snake Case",
  defaultStyle: { icon: "fa-font" },
  namespace,
  description: "Converts a string to snake case",
  inputs: { string: { description: "String to convert to snake case" } },
  outputs: { value: { description: "Converted value" } },
  run: ({ string }, { value }) =>
    value.next(
      string
        .replace(/([a-z])([A-Z])/g, "$1_$2")
        .replace(/\s+/g, "_")
        .toLowerCase()
    ),
};
