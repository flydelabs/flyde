import { InternalCodeNode } from "@flyde/core";

const namespace = "Lists";

export const AccumulateSomeValuesByCount: InternalCodeNode = {
  id: "Accumulate Some Values by Count",
  icon: "fa-basket-shopping",
  namespace,
  description:
    'Accumulates values sent to the "accept" input. Emits the list after the total items passed to both "accept" and "ignore" inputs reach the specified count.',
  inputs: {
    accept: { description: "Values to accumulate" },
    ignore: { description: "Values to ignore" },
    count: {
      description: "Number of values to accumulate before emitting them",
    },
  },
  reactiveInputs: ["accept", "ignore"],
  outputs: {
    accumulated: { description: "The accumulated accepted values" },
    ignored: { description: "The accumulated ignored values" },
  },
  run: (inputs, outputs, adv) => {
    const { accept, ignore, count } = inputs;
    const { accumulated, ignored } = outputs;
    const { state } = adv;

    const list = state.get("list") || [];
    const ignoredList = state.get("ignored") || [];

    if (typeof accept !== "undefined") {
      list.push(accept);
      state.set("list", list);
    }

    if (typeof ignore !== "undefined") {
      ignoredList.push(ignore);
      state.set("ignored", ignored);
    }

    if (list.length + ignoredList.length >= count) {
      accumulated.next(list);
      ignored.next(ignored);
    }
  },
};
