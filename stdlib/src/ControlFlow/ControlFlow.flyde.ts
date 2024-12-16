import { CodeNode } from "@flyde/core";

export * from "./Conditional/Conditional.flyde";
export * from "./Switch.flyde";
export * from "./RoundRobin.flyde";

const PubSub = require("pubsub-js");

const namespace = "Control Flow";

export const LimitTimes: CodeNode = {
  id: "Limit Times",
  namespace,
  description: "Item will be emitted until the limit is reached",
  inputs: {
    item: { mode: "required", description: "The item to emit" },
    times: {
      mode: "required",
      description: "The number of times to emit the item",
    },
    reset: { mode: "optional", description: "Reset the counter" },
  },
  outputs: { ok: {} },
  reactiveInputs: ["item", "reset"],
  completionOutputs: [],
  run: function (inputs, outputs, adv) {
    // magic here
    const { state } = adv;
    const { item, times, reset } = inputs;
    const { ok } = outputs;

    if (typeof reset !== "undefined") {
      state.set("val", 0);
      return;
    }

    let curr = state.get("val") || 0;
    curr++;
    state.set("val", curr);
    if (curr >= times) {
      adv.onError(new Error(`Limit of ${times} reached`));
    } else {
      ok.next(item);
    }
  },
};

export const Publish: CodeNode = {
  id: "Publish",
  namespace,
  description:
    "Publishes a value by a key to all listeners in the current flow. Use 'Subscribe' to listen to events.",
  inputs: {
    key: {
      mode: "required",
      description: "A key to use to subscribe to values",
    },
    value: { mode: "required" },
  },
  outputs: {},
  run: function (inputs, _, adv) {
    const nsKey = `${adv.ancestorsInsIds}__${inputs.key}`;

    PubSub.publish(nsKey, inputs.value);
  },
};

export const Subscribe: CodeNode = {
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
