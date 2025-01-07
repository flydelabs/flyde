import { CodeNode } from "@flyde/core";

const namespace = "Dates";

export const DateToHours: CodeNode = {
  id: "Date To Hours",
  defaultStyle: {
    icon: "fa-calendar",
  },
  namespace,
  description: "Converts a date to hours",
  inputs: {
    date: {
      description: "Date",
    },
  },
  outputs: {
    hours: {
      description: "Hours",
    },
  },
  run: ({ date }, { hours }) => hours.next(date.getHours()),
};
