import { CodeNode } from "@flyde/core";

const namespace = "Strings";

export const EmptyString: CodeNode = {
  id: "Empty String",
  namespace,
  defaultStyle: { icon: "fa-font", size: "small" },
  description: "Creates an empty string",
  inputs: {},
  outputs: { string: { description: "The empty string" } },
  run: (_, { string }) => string.next(""),
};
