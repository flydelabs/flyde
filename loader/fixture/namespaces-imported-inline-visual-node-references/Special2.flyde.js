module.exports = {
  id: "Special",
  inputs: {
    n: { mode: "required", type: "number" },
  },
  outputs: {
    r: "number",
  },
  run: (inputs, outputs) => {
    outputs.r.next(inputs.n + 2);
  },
};
