import { InternalCodeNode, nodeOutput } from "@flyde/core";

const node: InternalCodeNode = {
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
