import { CodeNode } from "@flyde/core";
export const RollingMedian: CodeNode = {
  id: "RollingMedian",
  displayName: "Rolling Median",
  description: "Emits the median of all the numbers it received",
  inputs: { n: { description: "Number to add to the rolling median" } },
  outputs: { median: { description: "The median of all the numbers" } },
  run: ({ n }, { median }, { state }) => {
    const numbers = state.get("numbers") ?? [];
    numbers.push(n);
    state.set("numbers", numbers);
    numbers.sort((a, b) => a - b);
    const mid = Math.floor(numbers.length / 2);
    const med = numbers.length % 2 !== 0 ? numbers[mid] : (numbers[mid - 1] + numbers[mid]) / 2;
    median.next(med);
  },
};