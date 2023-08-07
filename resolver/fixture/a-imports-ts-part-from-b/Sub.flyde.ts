import { CodeNode, nodeOutput } from "@flyde/core";

const part: CodeNode = {
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

export default part;
