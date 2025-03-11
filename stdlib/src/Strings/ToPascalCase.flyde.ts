import { InternalCodeNode } from "@flyde/core";

const namespace = "Strings";

export const ToPascalCase: InternalCodeNode = {
  id: "To Pascal Case",
  defaultStyle: { icon: "fa-font" },
  namespace,
  description: "Converts a string to pascal case",
  inputs: { string: { description: "String to convert to pascal case" } },
  outputs: { value: { description: "Converted value" } },
  run: ({ string }, { value }) =>
    value.next(
      string
        .replace(/(?:^\w|[A-Z]|\b\w)/g, (match, index) => {
          return index === 0 ? match.toUpperCase() : match.toLowerCase();
        })
        .replace(/\s+/g, "")
    ),
};
