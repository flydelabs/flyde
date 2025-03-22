import { CodeNode } from "@flyde/core";

const namespace = "Console";

export const Log: CodeNode = {
  id: "Log2",
  menuDisplayName: "Console Log",
  namespace,
  icon: "terminal",
  displayName: "Log {{value}}",
  description: "Logs a value to the console",
  inputs: {
    value: {
      description: "Value to log",
    },
  },
  outputs: {
    loggedValue: {
      description: "The value that was logged",
    },
  },
  run: (inputs, outputs) => {
    const { value } = inputs;
    console.log(value);
    outputs.loggedValue.next(value);
  },
};
