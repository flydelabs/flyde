import { InternalCodeNode } from "@flyde/core";

const namespace = "Dates";

export const DateToString: InternalCodeNode = {
  id: "Date To String",
  defaultStyle: {
    icon: "fa-calendar",
  },
  namespace,
  description: "Converts a date to a string",
  inputs: { date: { description: "Date" } },
  outputs: { string: { description: "String" } },
  run: ({ date }, { string }) => string.next(date.toString()),
};
