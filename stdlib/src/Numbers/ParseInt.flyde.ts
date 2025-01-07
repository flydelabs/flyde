import { CodeNode } from "@flyde/core";

const namespace = "Numbers";
export const ParseInt: CodeNode = {
  id: "Parse Int",
  namespace,
  description: "Emits the integer value of a string",
  inputs: { str: { description: "String to parse" } },
  outputs: { int: { description: "The integer value of str" } },
  run: ({ str }, { int }) => int.next(parseInt(str)),
};
