import { CodeNode } from "@flyde/core";

const namespace = "Dates";

export const DateToDayOfWeek: CodeNode = {
  id: "Date To Day Of Week",
  defaultStyle: {
    icon: "fa-calendar",
  },
  namespace,
  description: "Converts a date to a day of the week",
  inputs: { date: { description: "Date" } },
  outputs: { day: { description: "Day" } },
  run: ({ date }, { day }) => day.next(date.getDay()),
};
