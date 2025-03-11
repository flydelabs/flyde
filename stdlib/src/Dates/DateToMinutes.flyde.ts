import { InternalCodeNode } from "@flyde/core";

const namespace = "Dates";

export const DateToMinutes: InternalCodeNode = {
  id: "Date To Minutes",
  defaultStyle: {
    icon: "fa-calendar",
  },
  namespace,
  description: "Converts a date to minutes",
  inputs: { date: { description: "Date" } },
  outputs: { minutes: { description: "Minutes" } },
  run: ({ date }, { minutes }) => minutes.next(date.getMinutes()),
};
