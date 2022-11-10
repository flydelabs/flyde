const PubSub = require("pubsub-js");

module.exports = {
  id: "Subscribe",
  inputs: { key: { mode: "required", type: "any" }, initial: {mode: "required-if-connected", type: "any"} },
  outputs: { val: { type: "any" } },
  completionOutputs: ["never"],
  fn: function (inputs, outputs, adv) {
    // magic here
    const token = PubSub.subscribe(inputs.key, (_, data) => {
      outputs.val.next(data);
    });

    if (typeof inputs.initial !== 'undefined') {
      outputs.val.next(inputs.initial);
    }

    adv.onCleanup(() => {
      PubSub.unsubscribe(token);
    });
  },
};
