import { CodeNode, partOutput } from "@flyde/core";

const part: CodeNode = {
  id: "Sub",
  inputs: {
    a: { mode: "required" },
    b: { mode: "required" },
  },
  outputs: {
    r: partOutput(),
  },
  run: (inputs, outputs) => {
    outputs.r.next(inputs.a - inputs.b);
  },
};

export default part;
