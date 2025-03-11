import { InternalCodeNode } from "@flyde/core";

const namespace = "Strings";

export const ToCamelCase: InternalCodeNode = {
  id: "To Camel Case",
  defaultStyle: { icon: "fa-font" },
  namespace,
  description: "Converts a string to camel case",
  inputs: { string: { description: "String to convert to camel case" } },
  outputs: { value: { description: "Converted value" } },
  run: ({ string }, { value }) =>
    value.next(
      string.replace(/(?:^\w|[A-Z]|\b\w|\s+)/g, (match, index) => {
        if (+match === 0) return "";
        return index === 0 ? match.toLowerCase() : match.toUpperCase();
      })
    ),
};
