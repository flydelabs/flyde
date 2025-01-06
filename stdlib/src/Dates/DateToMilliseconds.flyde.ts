import { CodeNode } from "@flyde/core";

const namespace = "Dates";

export const DateToMilliseconds: CodeNode = {
  id: "Date To Milliseconds",
  defaultStyle: {
    icon: "fa-calendar",
  },
  namespace,
  description: "Converts a date to milliseconds",
  inputs: { date: { description: "Date" } },
  outputs: { milliseconds: { description: "Milliseconds" } },
  run: ({ date }, { milliseconds }) =>
    milliseconds.next(date.getMilliseconds()),
};
