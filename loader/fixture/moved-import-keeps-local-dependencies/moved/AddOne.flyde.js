module.exports = {
  id: "AddOne",
  inputs: {
    n: { mode: "required", type: "number" },
  },
  outputs: {
    r: "number",
  },
  run: (inputs, outputs) => {
    outputs.r.next(inputs.n + 1);
  },
};
