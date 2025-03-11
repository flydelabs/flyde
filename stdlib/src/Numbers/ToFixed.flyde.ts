import { InternalCodeNode } from "@flyde/core";

const namespace = "Numbers";
export const ToFixed: InternalCodeNode = {
  id: "To Fixed",
  namespace,
  description: "Emits the specified number of decimal places of a number",
  inputs: {
    number: { description: "Number to format" },
    places: { description: "Number of decimal places to format to" },
  },
  outputs: {
    fixed: {
      description: "The number with the specified number of decimal places",
    },
  },
  run: ({ number, places }, { fixed }) => fixed.next(number.toFixed(places)),
};
