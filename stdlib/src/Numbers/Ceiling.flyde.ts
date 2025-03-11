import { InternalCodeNode } from "@flyde/core";

const namespace = "Numbers";
export const Ceiling: InternalCodeNode = {
  id: "Ceiling",
  defaultStyle: {
    icon: "fa-ceiling",
  },
  namespace,
  description: "Emits the ceiling of a number",
  inputs: { n: { description: "Number to take the ceiling of" } },
  outputs: { ceiling: { description: "The ceiling of n" } },
  run: ({ n }, { ceiling }) => ceiling.next(Math.ceil(n)),
};
