import { CodeNode } from "@flyde/core";

const namespace = "Numbers";
export const AbsoluteValue: CodeNode = {
  id: "Absolute Value",
  defaultStyle: {
    icon: "fa-abs",
  },
  namespace,
  description: "Emits the absolute value of a number",
  inputs: { n: { description: "Number to take the absolute value of" } },
  outputs: { absolute: { description: "The absolute value of n" } },
  run: ({ n }, { absolute }) => absolute.next(Math.abs(n)),
};
