import { CodePart } from "@flyde/core";

const namespace = "Lists";

export const ListLength: CodePart = {
  id: "List Length",
  defaultStyle: {
    icon: "fa-list",
  },
  namespace,
  description: "Returns the length of a list",
  inputs: { list: { description: "List" } },
  outputs: { length: { description: "Length" } },
  run: ({ list }, { length }) => length.next(list.length),
};

export const ListIsEmpty: CodePart = {
  id: "List Is Empty",
  defaultStyle: {
    icon: "fa-list",
  },
  namespace,
  description: "Returns true if the list is empty",
  inputs: { list: { description: "List" } },
  outputs: { isEmpty: { description: "Is empty" } },
  run: ({ list }, { isEmpty }) => isEmpty.next(list.length === 0),
};

export const GetListElement: CodePart = {
  id: "Get List Element",
  defaultStyle: {
    icon: "fa-list",
  },
  namespace,
  description: "Returns the element at the specified index",
  inputs: {
    list: { description: "List" },
    index: { description: "Index" },
  },
  outputs: { element: { description: "Element" } },
  run: ({ list, index }, { element }) => element.next(list[index]),
};

export const Repeat: CodePart = {
  id: "Repeat",
  defaultStyle: {
    icon: "fa-list",
  },
  namespace,
  description: "Repeats a value a number of times",
  inputs: {
    value: { description: "Value to repeat" },
    times: { description: "How many times will the value be repeated" },
  },
  outputs: { list: { description: "List" } },
  run: ({ value, times }, { list }) => {
    const result = [];
    for (let i = 0; i < times; i++) {
      result.push(value);
    }
    return list.next(result);
  },
};

export const ListFrom2: CodePart = {
  id: "List From 2",
  defaultStyle: {
    icon: "fa-list",
  },
  namespace,
  description: "Creates a list from two values",
  inputs: {
    value1: { description: "First value" },
    value2: { description: "Second value" },
  },
  outputs: { list: { description: "List containing the 2 values" } },
  run: ({ value1, value2 }, { list }) => list.next([value1, value2]),
};

export const ListFrom3: CodePart = {
  id: "List From 3",
  defaultStyle: {
    icon: "fa-list",
  },
  namespace,
  description: "Creates a list from three values",
  inputs: {
    value1: { description: "First value" },
    value2: { description: "Second value" },
    value3: { description: "Third value" },
  },
  outputs: { list: { description: "List containing all 3 values" } },
  run: ({ value1, value2, value3 }, { list }) =>
    list.next([value1, value2, value3]),
};

export const ListFrom4: CodePart = {
  id: "List From 4",
  defaultStyle: {
    icon: "fa-list",
  },
  namespace,
  description: "Creates a list from four values",
  inputs: {
    value1: { description: "First value" },
    value2: { description: "Second value" },
    value3: { description: "Third value" },
    value4: { description: "Fourth value" },
  },
  outputs: { list: { description: "List containing all 4 values" } },
  run: ({ value1, value2, value3, value4 }, { list }) =>
    list.next([value1, value2, value3, value4]),
};

export const ListFrom5: CodePart = {
  id: "List From 5",
  defaultStyle: {
    icon: "fa-list",
  },
  namespace,
  description: "Creates a list from five values",
  inputs: {
    value1: { description: "First value" },
    value2: { description: "Second value" },
    value3: { description: "Third value" },
    value4: { description: "Fourth value" },
    value5: { description: "Fifth value" },
  },
  outputs: { list: { description: "List containing all 5 values" } },
  run: ({ value1, value2, value3, value4, value5 }, { list }) =>
    list.next([value1, value2, value3, value4, value5]),
};

export const ConcatLists: CodePart = {
  id: "Concat Lists",
  defaultStyle: {
    icon: "fa-list",
  },
  namespace,
  description: "Concatenates two lists",
  inputs: {
    list1: { description: "First list" },
    list2: { description: "Second list" },
  },
  outputs: { list: { description: "Concatenated list" } },
  run: ({ list1, list2 }, { list }) => list.next([...list1, ...list2]),
};

export const Reverse: CodePart = {
  id: "Reverse",
  defaultStyle: {
    icon: "fa-list",
  },
  namespace,
  description: "Reverses a list",
  inputs: { list: { description: "List" } },
  outputs: { reversed: { description: "Reversed list" } },
  run: ({ list }, { reversed }) => reversed.next(list.reverse()),
};

export const LoopList: CodePart = {
  id: "Loop List",
  defaultStyle: {
    icon: "fa-list",
  },
  namespace,
  searchKeywords: ["each", "spread"],
  description: "Emits all values in a list",
  inputs: {
    list: { description: "The list to loop" },
  },
  outputs: {
    item: { description: "Will emit a value for each item in the list" },
    index: { description: "Will emit the index of the item" },
    length: { description: "Will emit the length of the list" },
  },
  run: (inputs, outputs) => {
    const { list } = inputs;
    const { item, index } = outputs;
    for (const i of list) {
      item.next(i);
      index.next(list.indexOf(i));
    }
    outputs.length.next(list.length);
  },
};

export const HeadAndRest: CodePart = {
  id: "Head and rest",
  defaultStyle: {
    icon: "fa-list",
  },
  namespace,
  description:
    "Receives a list and emits two outputs: the first item and the rest of the list",
  inputs: {
    list: { description: "The list" },
  },
  outputs: {
    head: { description: "The first item in the list" },
    rest: { description: "The rest of the list" },
  },
  run: (inputs, outputs) => {
    const { list } = inputs;
    const { head, rest } = outputs;
    head.next(list[0]);
    rest.next(list.slice(1));
  },
};

export const SplitTuple: CodePart = {
  id: "Split Pair",
  defaultStyle: {
    icon: "fa-list",
  },
  namespace,
  description:
    "Receives a list with 2 items and emits two outputs: the first item and the second item",
  inputs: {
    pair: { description: "The pair to split" },
  },
  outputs: {
    item1: { description: "The first item in the pair" },
    item2: { description: "The second item in the pair" },
  },
  run: (inputs, outputs) => {
    const { pair } = inputs;
    const { item1, item2 } = outputs;
    item1.next(pair[0]);
    item2.next(pair[1]);
  },
};

export const SplitTriple: CodePart = {
  id: "Split Triple",
  defaultStyle: {
    icon: "fa-list",
  },
  namespace,
  description:
    "Receives a list with 3 items and emits three outputs: the first item, the second item and the third item",
  inputs: {
    triple: { description: "The triple" },
  },
  outputs: {
    item1: { description: "The first item in the triple" },
    item2: { description: "The second item in the triple" },
    item3: { description: "The third item in the triple" },
  },
  run: (inputs, outputs) => {
    const { list } = inputs;
    const { item1, item2, item3 } = outputs;
    item1.next(list[0]);
    item2.next(list[1]);
    item3.next(list[2]);
  },
};

export const SplitQuadruple: CodePart = {
  id: "Split Quadruple",
  defaultStyle: {
    icon: "fa-list",
  },
  namespace,
  description:
    "Receives a list with 4 items and emits four outputs: the first item, the second item, the third item and the fourth item",
  inputs: {
    quadruple: { description: "The quadruple" },
  },
  outputs: {
    item1: { description: "The first item in the quadruple" },
    item2: { description: "The second item in the quadruple" },
    item3: { description: "The third item in the quadruple" },
    item4: { description: "The fourth item in the quadruple" },
  },
  run: (inputs, outputs) => {
    const { list } = inputs;
    const { item1, item2, item3, item4 } = outputs;
    item1.next(list[0]);
    item2.next(list[1]);
    item3.next(list[2]);
    item4.next(list[3]);
  },
};

export const AccumulateValuesUntilTrigger: CodePart = {
  id: "Accumulate Values by Trigger",
  defaultStyle: {
    icon: "fa-basket-shopping",
  },
  namespace,
  description:
    'Accumulates values sent to the "value" input, until the "reset" input is triggered. Then it emits the accumulated values and resets the accumulator.',
  inputs: {
    value: { description: "The value to accumulate" },
    reset: { description: "Resets the accumulator" },
  },
  reactiveInputs: ["value", "reset"],
  outputs: {
    accumulated: { description: "The accumulated values" },
  },
  run: (inputs, outputs, adv) => {
    const { item, until } = inputs;
    const { r } = outputs;
    const { state } = adv;

    let list = state.get("list") || [];

    if (typeof item !== "undefined") {
      list.push(item);
      state.set("list", list);
    }

    if (typeof until !== "undefined") {
      r.next(list);
    }
  },
};

export const AccumulateValuesByTime: CodePart = {
  id: "Accumulate Values by Time",
  defaultStyle: {
    icon: "fa-basket-shopping",
  },
  namespace,
  description:
    'Accumulates values sent to the "value" input. After the specified time it emits the accumulated values and resets the accumulator.',
  inputs: {
    value: { description: "The value to accumulate" },
    time: {
      description:
        "Time to wait before emitting the accumulated values. Default is 200ms",
      defaultValue: 200,
      mode: "required-if-connected",
    },
  },
  reactiveInputs: ["value"],
  outputs: {
    accumulated: { description: "The accumulated values" },
  },
  run: (inputs, outputs, adv) => {
    const { value, time } = inputs;
    const { accumulated } = outputs;
    const { state } = adv;

    let list = state.get("list") || [];

    const bob = Date.now() % 1000;
    console.log("called", inputs.value, inputs.time, bob);
    state.set("bob", 2);
    console.log(Array.from(state.entries()));

    if (typeof value !== "undefined") {
      list.push(value);
      state.set("list", list);
    }

    if (state.get("timeout")) {
      clearTimeout(state.get("timeout"));
    }

    const promise = new Promise<void>((resolve) => {
      state.set("resolve", resolve);
    });

    state.set(
      "timeout",
      setTimeout(() => {
        console.log("emitting", list, bob, Date.now() % 1000);
        accumulated.next(list);

        state.set("list", []);
        const resolve = state.get("resolve");
        if (!resolve) {
          throw new Error("resolve is undefined");
        }
        resolve();
      }, time)
    );

    return promise;
  },
};

export const AccumulateValuesByCount: CodePart = {
  id: "Accumulate Values by Count",
  defaultStyle: {
    icon: "fa-basket-shopping",
  },
  namespace,
  description:
    'Accumulates values sent to the "value" input. After the specified count it emits the accumulated values and resets the accumulator.',
  inputs: {
    value: { description: "The value to accumulate" },
    count: {
      description: "Number of values to accumulate before emitting them",
    },
  },
  reactiveInputs: ["value"],
  outputs: {
    accumulated: { description: "The accumulated values" },
  },
  completionOutputs: ["accumulated"],
  run: (inputs, outputs, adv) => {
    const { value, count } = inputs;
    const { accumulated } = outputs;
    const { state } = adv;

    let list = state.get("list") || [];

    if (typeof value !== "undefined") {
      list.push(value);
      state.set("list", list);
    }

    if (list.length >= count) {
      accumulated.next(list);
    }
  },
};

export const AccumulateSomeValuesByCount: CodePart = {
  id: "Accumulate Some Values by Count",
  defaultStyle: {
    icon: "fa-basket-shopping",
  },
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

    let list = state.get("list") || [];
    let ignoredList = state.get("ignored") || [];

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

export const Append: CodePart = {
  id: "Append",
  namespace,
  description: "Appends an item to a list",
  inputs: {
    list: { description: "The list" },
    item: { description: "The item to append" },
  },
  outputs: { list: { description: "The resulting list" } },
  run: ({ list, item }, { list: outputList }) => {
    outputList.next([...list, item]);
  },
  defaultStyle: {
    icon: "fa-plus",
  },
};

export const Prepend: CodePart = {
  id: "Prepend",
  namespace,
  description: "Prepends an item to a list",
  inputs: {
    list: { description: "The list" },
    item: { description: "The item to prepend" },
  },
  outputs: { list: { description: "The resulting list" } },
  run: ({ list, item }, { list: outputList }) => {
    outputList.next([item, ...list]);
  },
  defaultStyle: {
    icon: "fa-arrow-up",
  },
};

export const Remove: CodePart = {
  id: "Remove",
  namespace,
  description: "Removes an item from a list",
  inputs: {
    list: { description: "The list" },
    item: { description: "The item to remove" },
  },
  outputs: { list: { description: "The resulting list" } },
  run: ({ list, item }, { list: outputList }) => {
    outputList.next(list.filter((i) => i !== item));
  },
  defaultStyle: {
    icon: "fa-minus",
  },
};

export const RemoveAt: CodePart = {
  id: "Remove At",
  namespace,
  description: "Removes an item from a list at the specified index",
  inputs: {
    list: { description: "The list" },
    index: { description: "The index of the item to remove" },
  },
  outputs: { list: { description: "The resulting list" } },
  run: ({ list, index }, { list: outputList }) => {
    outputList.next(list.filter((_, idx) => idx !== index));
  },
  defaultStyle: {
    icon: "fa-times",
  },
};

export const Slice: CodePart = {
  id: "Slice",
  namespace,
  description:
    "Returns a slice of a list from the specified start index to the specified end index",
  inputs: {
    list: { description: "The list" },
    start: { description: "The index to start slicing from" },
    end: { description: "The index to end slicing at" },
  },
  outputs: { list: { description: "The resulting list" } },
  run: ({ list, start, end }, { list: outputList }) => {
    outputList.next(list.slice(start, end));
  },
  defaultStyle: {
    icon: "fa-cut",
  },
};

export const Flatten: CodePart = {
  id: "Flatten",
  namespace,
  description: "Flattens a list of lists into a single list",
  inputs: { list: { description: "The list of lists" } },
  outputs: { list: { description: "The resulting list" } },
  run: ({ list }, { list: outputList }) => {
    outputList.next(list.reduce((acc, item) => [...acc, ...item], []));
  },
  defaultStyle: {
    icon: "fa-compress",
  },
};
