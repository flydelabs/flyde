import { InternalCodeNode } from "@flyde/core";

// eslint-disable-next-line @typescript-eslint/no-var-requires
const PubSub = require("pubsub-js");

const namespace = "Control Flow";

export const Subscribe: InternalCodeNode = {
  id: "Subscribe",
  namespace,
  description:
    "Subscribes to a value published by a key. Use 'Publish' to publish values.",
  inputs: {
    key: {
      mode: "required",
      description: "A key to use to subscribe to values",
    },
    initial: {
      mode: "required-if-connected",
      description: "If passed will be published has the first value",
    },
  },
  completionOutputs: [],
  outputs: { value: { description: "The value published by the key" } },
  run: function (inputs, outputs, adv) {
    const { value } = outputs;
    const nsKey = `${adv.ancestorsInsIds}__${inputs.key}`;
    const token = PubSub.subscribe(nsKey, (_, data) => {
      value.next(data);
    });

    if (typeof inputs.initial !== "undefined") {
      value.next(inputs.initial);
    }

    adv.onCleanup(() => {
      PubSub.unsubscribe(token);
    });
  },
};
