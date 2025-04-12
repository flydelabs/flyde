
import type { CodeNode } from "@flyde/core";

/*
 Feel free to change the content of this file to experiment with the code nodes
 You can then import any exported node here from your other visual nodes.
 
 Full API reference: https://www.flyde.dev/docs/custom-nodes/
 */

const node: CodeNode = {
  id: "Subtract",
  displayName: "Subtract",
  icon: "fa-minus",
  description: "Emits the difference between two numbers",
  inputs: {
    n1: { description: "Number to subtract from" },
    n2: { description: "Number to subtract" },
  },
  outputs: { difference: { description: "The difference between n1 and n2" } },
  run: ({ n1, n2 }, { difference }) => difference.next(n1 - n2),
};

export default node;
