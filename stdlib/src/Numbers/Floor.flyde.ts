import { CodeNode } from "@flyde/core";

const namespace = "Numbers";
export const Floor: CodeNode = {
  id: "Floor",
  defaultStyle: {
    icon: "fa-floor",
  },
  namespace,
  description: "Emits the floor of a number",
  inputs: { n: { description: "Number to take the floor of" } },
  outputs: { floor: { description: "The floor of n" } },
  run: ({ n }, { floor }) => floor.next(Math.floor(n)),
};
