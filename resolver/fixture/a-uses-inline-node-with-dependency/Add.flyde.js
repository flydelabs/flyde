module.exports = {
  id: "Add",
  inputs: {
    a: { mode: "required", type: "number" },
  },
  outputs: {
    r: "number",
  },
  run: (inputs, outputs) => {
    outputs.r.next(inputs.a + 1);
  },
};
