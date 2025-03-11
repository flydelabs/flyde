import { InternalCodeNode } from "@flyde/core";

const namespace = "Numbers";
export const Round: InternalCodeNode = {
  id: "Round",
  defaultStyle: {
    icon: "fa-round",
  },
  namespace,
  description: "Emits the rounded value of a number",
  inputs: { n: { description: "Number to round" } },
  outputs: { rounded: { description: "The rounded value of n" } },
  run: ({ n }, { rounded }) => rounded.next(Math.round(n)),
};
