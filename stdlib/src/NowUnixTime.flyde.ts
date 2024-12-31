import { CodeNode } from "@flyde/core";

const namespace = "Dates";

export const NowUnixTime: CodeNode = {
  id: "Now Unix Time",
  defaultStyle: {
    icon: "fa-calendar",
  },
  namespace,
  description: "Returns the current date and time as a Unix time",
  inputs: {},
  outputs: { now: { description: "Current date and time" } },
  run: (_, { now }) => now.next(new Date().getTime()),
};
