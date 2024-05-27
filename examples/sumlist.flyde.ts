import { CodeNode } from "@flyde/core";
export const SumList: CodeNode = {
  id: "SumList",
  displayName: "Sum List",
  description: "Emits the sum of a list of numbers",
  inputs: {
    numbers: { description: "List of numbers to sum" },
  },
  outputs: { sum: { description: "The sum of the list of numbers" } },
  run: ({ numbers }, { sum }) => {
    sum.next(numbers.reduce((a, b) => a + b, 0));
  },
};