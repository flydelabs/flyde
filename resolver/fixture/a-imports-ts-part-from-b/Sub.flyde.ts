import { CodePart, partOutput } from "@flyde/core";

const part: CodePart = {
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
