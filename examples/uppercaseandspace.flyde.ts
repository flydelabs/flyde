import { CodeNode } from "@flyde/core";
export const UppercaseAndSpace: CodeNode = {
  id: "UppercaseAndSpace",
  displayName: "Uppercase And Space",
  description: "Emits the input string in uppercase with spaces between each character",
  inputs: { str: { description: "String to transform" } },
  outputs: { result: { description: "The transformed string" } },
  run: ({ str }, { result }) => {
    const transformed = str.toUpperCase().split('').join(' ');
    result.next(transformed);
  },
};