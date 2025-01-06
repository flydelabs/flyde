import { CodeNode } from "@flyde/core";

const namespace = "Strings";

export const MatchRegex: CodeNode = {
  id: "Match Regex",
  namespace,
  defaultStyle: { icon: "fa-font" },
  description: "Determines whether a string matches a regular expression",
  inputs: {
    string: { description: "String to check" },
    regex: { description: "Regular expression to match" },
  },
  outputs: { value: { description: "Result" } },
  run: ({ string, regex }, { value }) => value.next(string.match(regex)),
};
