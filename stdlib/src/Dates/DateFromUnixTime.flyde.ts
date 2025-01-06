import { CodeNode } from "@flyde/core";

const namespace = "Dates";

export const DateFromUnixTime: CodeNode = {
  id: "Date From Unix Time",
  defaultStyle: {
    icon: "fa-calendar",
  },
  namespace,
  description: "Creates a date from a Unix time",
  inputs: { time: { description: "Unix time" } },
  outputs: { date: { description: "Date" } },
  run: ({ time }, { date }) => date.next(new Date(time)),
};
