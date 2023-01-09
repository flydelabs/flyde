module.exports = {
  id: "RoundRobin3",
  inputs: { item: { mode: "required", type: "any" } },
  outputs: { r1: { type: "any" }, r2: { type: "any" }, r3: { type: "any" } },
  completionOutputs: [],
  reactiveInputs: ["item"],
  fn: function (inputs, outputs, adv) {
    const { state } = adv;
    const { r1, r2, r3 } = outputs;
    const curr = state.get("curr") || 0;

    const o = [r1, r2, r3][curr];

    const nextCurr = (curr + 1) % 3;

    log(nextCurr, curr);
    o.next(inputs.item);
    state.set("curr", nextCurr);
  },
};
