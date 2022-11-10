const PubSub = require("pubsub-js");

module.exports = {
  id: "Publish",
  inputs: { key: { mode: "required", type: "any" }, value: { mode: "required", type: "any" } },
  outputs: {},
  fn: function (inputs, outputs, adv) {
    // magic here

    PubSub.publish(inputs.key, inputs.value);
  },
};
