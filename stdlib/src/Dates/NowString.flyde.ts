import { InternalCodeNode } from "@flyde/core";

const namespace = "Dates";

export const NowString: InternalCodeNode = {
  id: "Now String",
  defaultStyle: {
    icon: "fa-calendar",
  },
  namespace,
  description: "Returns the current date and time as a string",
  inputs: {},
  outputs: { now: { description: "Current date and time" } },
  run: (_, { now }) => now.next(new Date().toString()),
};
