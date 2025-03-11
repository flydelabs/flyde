import { InternalCodeNode } from "@flyde/core";

const namespace = "Strings";

export const ToTitleCase: InternalCodeNode = {
  id: "To Title Case",
  defaultStyle: { icon: "fa-font" },
  namespace,
  description: "Converts a string to title case",
  inputs: { string: { description: "String to convert to title case" } },
  outputs: { value: { description: "Converted value" } },
  run: ({ string }, { value }) =>
    value.next(
      string.replace(
        /\w\S*/g,
        (match) => match.charAt(0).toUpperCase() + match.substr(1).toLowerCase()
      )
    ),
};
