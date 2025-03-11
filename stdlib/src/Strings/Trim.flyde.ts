import { InternalCodeNode } from "@flyde/core";

const namespace = "Strings";

export const Trim: InternalCodeNode = {
  id: "Trim",
  defaultStyle: { icon: "fa-font" },
  namespace,
  description: "Trims a string",
  inputs: { string: { description: "String to trim" } },
  outputs: { value: { description: "Trimmed value" } },
  run: ({ string }, { value }) => value.next(string.trim()),
};
