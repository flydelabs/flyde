import { InternalCodeNode } from "@flyde/core";

const namespace = "Dates";

export const Now: InternalCodeNode = {
  id: "Now",
  defaultStyle: {
    icon: "fa-calendar",
  },
  namespace,
  description: "Returns the current date and time",
  inputs: {},
  outputs: { now: { description: "Current date and time" } },
  run: (_, { now }) => now.next(new Date()),
};
