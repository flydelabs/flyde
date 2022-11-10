module.exports = {
  id: "AccumulateUntil",
  inputs: { item: { mode: "optional", type: "any" }, until: { mode: "optional", type: "any" } },
  outputs: { r: { type: "any" } },
  completionOutputs: ["r"],
  reactiveInputs: ["item", "until"],
  fn: function (inputs, outputs, adv) {
    // magic here
    const { item, until } = inputs;
    const { r } = outputs;
    const { state } = adv;

    let list = state.get("list") || [];

    if (typeof item !== 'undefined') {
      list.push(item);
      state.set("list", list);
    }

    if (typeof until !== 'undefined') {
      r.next(list);
    }
  },
};
