import { InternalCodeNode } from "@flyde/core";

const namespace = "Dates";

export const DateToSeconds: InternalCodeNode = {
  id: "Date To Seconds",
  defaultStyle: {
    icon: "fa-calendar",
  },
  namespace,
  description: "Converts a date to seconds",
  inputs: { date: { description: "Date" } },
  outputs: { seconds: { description: "Seconds" } },
  run: ({ date }, { seconds }) => seconds.next(date.getSeconds()),
};
