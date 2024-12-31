import { CodeNode } from "@flyde/core";

const namespace = "Dates";

export const DateFromString: CodeNode = {
  id: "Date From String",
  defaultStyle: {
    icon: "fa-calendar",
  },
  namespace,
  description: "Creates a date from a string",
  inputs: { string: { description: "String" } },
  outputs: { date: { description: "Date" } },
  run: ({ string }, { date }) => date.next(new Date(string)),
};
