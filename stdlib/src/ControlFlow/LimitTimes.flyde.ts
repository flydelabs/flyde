import { InternalCodeNode } from "@flyde/core";

const namespace = "Control Flow";

export const LimitTimes: InternalCodeNode = {
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
