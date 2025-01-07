import { CodeNode } from "@flyde/core";

const namespace = "Dates";

export const DateToUnixTime: CodeNode = {
  id: "Date To Unix Time",
  defaultStyle: {
    icon: "fa-calendar",
  },
  namespace,
  description: "Converts a date to a Unix time",
  inputs: { date: { description: "Date" } },
  outputs: { time: { description: "Unix time" } },
  run: ({ date }, { time }) => time.next(date.getTime()),
};
