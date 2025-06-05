import type { CodeNode } from "@flyde/core";

const namespace = "utils";

export const ThrowError: CodeNode = {
  id: "ThrowError",
  menuDisplayName: "Throw Error",
  namespace,
  icon: "fa-triangle-exclamation",
  displayName: "Throw Error",
  description: "Throws an error with a custom message",
  inputs: {
    message: {
      defaultValue: "Intentional error",
      description: "The error message to throw",
      editorType: "string",
    },
  },
  outputs: {},
  run: (inputs, outputs, adv) => {
    const { message } = inputs;
    throw new Error(message);
  },
};
