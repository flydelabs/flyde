import { CodeNode } from "@flyde/core";

const namespace = "Numbers";
export const SumList: CodeNode = {
  id: "Sum List",
  icon: "fa-plus",
  namespace,
  description: "Emits the sum of a list of numbers",
  inputs: { list: { description: "List of numbers" } },
  outputs: { sum: { description: "The sum of the numbers in list" } },
  run: ({ list }, { sum }) => sum.next(list.reduce((a, b) => a + b, 0)),
};
