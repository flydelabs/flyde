module.exports = {
  id: "Debounce",
  inputs: {
    value: { mode: "required", type: "any", description: "The data that needs to be debounced"},
    wait: { mode: "required", type: "any", defaultValue: 250, description: "Time (in millis) to wait until 'value' is emitted"},
  },
  outputs: { result: { type: "any", description: 'The debounced value' } },
  customViewCode:
    "<% if (inputs.wait) { %> Debounce  <%- inputs.wait %>ms <% } else { %> Debounce <% } %>",
  completionOutputs: ["result"],
  reactiveInputs: ["value"],
  description:
    'Emits the last value received after being idle for "wait" amount of milliseconds',
  fn: function (inputs, outputs, adv) {
    const { value, wait } = inputs;
    const { result } = outputs;

    const timer = adv.state.get("timer");
    if (timer) {
      clearTimeout(timer);
    }

    const newTimer = setTimeout(() => {
      result.next(value);
    }, wait);

    adv.state.set("timer", newTimer);

    adv.onCleanup(() => {
      clearTimeout(timer);
    });
  },
};
