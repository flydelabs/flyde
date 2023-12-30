const fn = require("./very-cool-add-fn.js");

module.exports = {
  id: "Add",
  inputs: {
    a: { mode: "required", type: "number" },
    b: { mode: "required", type: "number" },
  },
  outputs: {
    r: "number",
  },
  run: (inputs, outputs) => {
    outputs.r.next(fn(inputs.a, inputs.b));
  },
};
