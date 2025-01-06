import { CodeNode } from "@flyde/core";

const namespace = "Strings";

export const ToKebabCase: CodeNode = {
  id: "To Kebab Case",
  defaultStyle: { icon: "fa-font" },
  namespace,
  description: "Converts a string to kebab case",
  inputs: { string: { description: "String to convert to kebab case" } },
  outputs: { value: { description: "Converted value" } },
  run: ({ string }, { value }) =>
    value.next(
      string
        .replace(/([a-z])([A-Z])/g, "$1-$2")
        .replace(/\s+/g, "-")
        .toLowerCase()
    ),
};
