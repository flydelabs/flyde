import { CodeNode, nodeOutput } from "@flyde/core";

const node: CodeNode = {
  id: "Sub",
  inputs: {
    a: { mode: "required" },
  },
  outputs: {
    r: nodeOutput(),
  },
  run: (inputs, outputs) => {
    outputs.r.next(inputs.a - 1);
  },
};

export default node;
