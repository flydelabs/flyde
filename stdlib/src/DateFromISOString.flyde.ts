import { CodeNode } from "@flyde/core";

const namespace = "Dates";

export const DateFromISOString: CodeNode = {
  id: "Date From ISO String",
  defaultStyle: {
    icon: "fa-calendar",
  },
  namespace,
  description: "Creates a date from an ISO string",
  inputs: {
    string: { description: "String" },
  },
  outputs: {
    date: { description: "Date" },
  },
  run: async ({ string }, { date }, { onError }) => {
    try {
      date.next(new Date(string));
    } catch (e) {
      console.error("Error in node", e);
      onError(e);
    }
  },
};
