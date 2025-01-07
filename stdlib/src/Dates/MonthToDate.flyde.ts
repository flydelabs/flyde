import { CodeNode } from "@flyde/core";

const namespace = "Dates";

export const MonthToDate: CodeNode = {
  id: "Month To Date",
  defaultStyle: {
    icon: "fa-calendar",
  },
  namespace,
  description: "Converts a date to a month",
  inputs: {
    date: {
      description: "Date",
    },
  },
  outputs: {
    month: {
      description: "Month",
    },
  },
  run: ({ date }, { month }) => month.next(date.getMonth()),
};
