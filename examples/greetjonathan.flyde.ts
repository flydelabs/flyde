import { CodeNode } from "@flyde/core";
export const GreetJonathan: CodeNode = {
  id: "GreetJonathan",
  displayName: "Greet Jonathan",
  description: "Emits a greeting message to Jonathan",
  inputs: {},
  outputs: { greeting: { description: "A greeting message to Jonathan" } },
  run: ({}, { greeting }) => greeting.next("Hello, Jonathan!"),
};