import { InternalCodeNode } from "@flyde/core";

const namespace = "Numbers";
export const Power: InternalCodeNode = {
  id: "Power",
  defaultStyle: {
    icon: "fa-superscript",
  },
  namespace,
  description: "Emits the power of two numbers",
  inputs: {
    n1: { description: "Base number" },
    n2: { description: "Exponent" },
  },
  outputs: { power: { description: "The power of n1 and n2" } },
  run: ({ n1, n2 }, { power }) => power.next(Math.pow(n1, n2)),
};
