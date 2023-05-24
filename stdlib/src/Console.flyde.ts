import { CodePart } from "@flyde/core";

const namespace = "Console";

export const Log: CodePart = {
  id: "Log",
  defaultStyle: {
    icon: "fa-terminal",
  },
  namespace,
  description: "Logs a value to the console",
  inputs: {
    value: { description: "Value to log" },
  },
  outputs: {},
  run: ({ value }) => console.log(value),
};

export const Error: CodePart = {
  id: "Error",
  defaultStyle: {
    icon: "fa-terminal",
  },
  namespace,
  description: "Logs an error to the console",
  inputs: {
    value: { description: "Value to log" },
  },
  outputs: {},
  run: ({ value }) => console.error(value),
};
