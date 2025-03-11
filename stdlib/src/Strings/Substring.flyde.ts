import { InternalCodeNode } from "@flyde/core";

const namespace = "Strings";

export const Substring: InternalCodeNode = {
  id: "Substring",
  defaultStyle: { icon: "fa-font" },
  namespace,
  description:
    "Returns the node of the string between the start and end indexes",
  inputs: {
    string: { description: "String to get substring from" },
    start: { description: "Start index" },
    end: { description: "End index" },
  },
  outputs: { value: { description: "Substring" } },
  run: ({ string, start, end }, { value }) =>
    value.next(string.substring(start, end)),
};
