import { InternalCodeNode } from "@flyde/core";

const namespace = "Numbers";
export const Truncate: InternalCodeNode = {
  id: "Truncate",
  defaultStyle: {
    icon: "fa-truncate",
  },
  namespace,
  description: "Emits the truncated value of a number",
  inputs: { n: { description: "Number to truncate" } },
  outputs: { truncated: { description: "The truncated value of n" } },
  run: ({ n }, { truncated }) => truncated.next(Math.trunc(n)),
};
