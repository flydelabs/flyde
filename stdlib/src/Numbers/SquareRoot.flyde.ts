import { InternalCodeNode } from "@flyde/core";

const namespace = "Numbers";
export const SquareRoot: InternalCodeNode = {
  id: "Square Root",
  defaultStyle: {
    icon: "fa-square-root-alt",
  },
  namespace,
  description: "Emits the square root of a number",
  inputs: { n: { description: "Number to take the square root of" } },
  outputs: { root: { description: "The square root of n" } },
  run: ({ n }, { root }) => root.next(Math.sqrt(n)),
};
