import { CodeNode, nodeOutput } from "@flyde/core";

const node: CodeNode = {
  id: "Sub",
  inputs: {
    a: { mode: "required" },
    b: { mode: "required" },
  },
  outputs: {
    r: nodeOutput(),
  },
  run: (inputs, outputs) => {
    outputs.r.next(inputs.a - inputs.b);
  },
};

export default node;
