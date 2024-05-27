import { CodeNode } from "@flyde/core";
export const GreetAndThank: CodeNode = {
  id: "GreetAndThank",
  displayName: "Greet And Thank",
  description: "Greets the user and thanks them for their feedback",
  inputs: {
    name: { description: "Name of the user" },
  },
  outputs: { message: { description: "Greet and thank message" } },
  run: ({ name }, { message }) => message.next(`Hello, ${name}! Thank you for your feedback!`),
};