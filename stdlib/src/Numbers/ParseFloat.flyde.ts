import { InternalCodeNode } from "@flyde/core";

const namespace = "Numbers";
export const ParseFloat: InternalCodeNode = {
  id: "Parse Float",
  namespace,
  description: "Emits the float value of a string",
  inputs: { str: { description: "String to parse" } },
  outputs: { float: { description: "The float value of str" } },
  run: ({ str }, { float }) => float.next(parseFloat(str)),
};
