import { CodeNode } from "@flyde/core";

const namespace = "Dates";

export const DateToTimezoneOffset: CodeNode = {
  id: "Date To Timezone Offset",
  defaultStyle: {
    icon: "fa-calendar",
  },
  namespace,
  description: "Converts a date to a timezone offset",
  inputs: { date: { description: "Date" } },
  outputs: { offset: { description: "Offset" } },
  run: ({ date }, { offset }) => offset.next(date.getTimezoneOffset()),
};
