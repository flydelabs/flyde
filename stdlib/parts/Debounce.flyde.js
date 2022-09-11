module.exports = {
  id: "Debounce",
  inputs: { i: { mode: "required", type: "any" }, ms: { mode: "required", type: "any" } },
  outputs: { r: { type: "any" } },
  customViewCode: "<% if (inputs.ms) { %> Debounce  <%- inputs.ms %>ms <% } else { %> Debounce <% } %>",
  completionOutputs: ["r"],
  reactiveInputs: ["i"],
  fn: function (inputs, outputs, adv) {
    const { i, ms } = inputs;
    const { r } = outputs;

    const timer = adv.state.get("timer");
    if (timer) {
      clearTimeout(timer);
    }

    const newTimer = setTimeout(() => {
      r.next(i);
    }, ms);

    adv.state.set("timer", newTimer);

    adv.onCleanup(() => {
      clearTimeout(timer);
    });
  },
};
