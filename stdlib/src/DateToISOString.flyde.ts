import { CodeNode } from "@flyde/core";

const namespace = "Dates";

export const DateToISOString: CodeNode = {
  id: "Date To ISO String",
  defaultStyle: {
    icon: "fa-calendar",
  },
  namespace,
  description: "Converts a date to an ISO string",
  inputs: { date: { description: "Date" } },
  outputs: { string: { description: "String" } },
  run: ({ date }, { string }) => string.next(date.toISOString()),
};
