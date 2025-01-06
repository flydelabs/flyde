import { CodeNode } from "@flyde/core";

const namespace = "Dates";

export const NowISOString: CodeNode = {
  id: "Now ISO String",
  defaultStyle: {
    icon: "fa-calendar",
  },
  namespace,
  description: "Returns the current date and time as a string in ISO format",
  inputs: {},
  outputs: { now: { description: "Current date and time" } },
  run: (_, { now }) => now.next(new Date().toISOString()),
};
