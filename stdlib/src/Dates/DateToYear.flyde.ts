import { InternalCodeNode } from "@flyde/core";

const namespace = "Dates";

export const DateToYear: InternalCodeNode = {
  id: "Date To Year",
  defaultStyle: {
    icon: "fa-calendar",
  },
  namespace,
  description: "Converts a date to a year",
  inputs: {
    date: { description: "Date" },
  },
  outputs: {
    year: { description: "Year" },
  },
  run: ({ date }, { year }) => year.next(date.getFullYear()),
};
