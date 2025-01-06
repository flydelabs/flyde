import { CodeNode } from "@flyde/core";

const namespace = "Dates";

export const DateToDay: CodeNode = {
  id: "Date To Day",
  defaultStyle: {
    icon: "fa-calendar",
  },
  namespace,
  description: "Converts a date to a day",
  inputs: {
    date: {
      description: "Date",
    },
  },
  outputs: {
    day: {
      description: "Day",
    },
  },
  run: ({ date }, { day }) => day.next(date.getDate()),
};
