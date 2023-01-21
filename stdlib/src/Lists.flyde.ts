import { CodePart, partFromSimpleFunction } from "@flyde/core";

const namespace = "Lists";

export const ListLength = partFromSimpleFunction({
  id: "List Length",
  icon: "fa-list",
  namespace,
  description: "Returns the length of a list",
  inputs: [{ name: "list", description: "List" }],
  output: { name: "length", description: "Length" },
  fn: (list) => list.length,
});

export const ListIsEmpty = partFromSimpleFunction({
  id: "List Is Empty",
  icon: "fa-list",
  namespace,
  description: "Returns true if the list is empty",
  inputs: [{ name: "list", description: "List" }],
  output: { name: "isEmpty", description: "Is empty" },
  fn: (list) => list.length === 0,
});

export const GetListElement = partFromSimpleFunction({
  id: "Get List Element",
  icon: "fa-list",
  namespace,
  description: "Returns the element at the specified index",
  inputs: [
    { name: "list", description: "List" },
    { name: "index", description: "Index" },
  ],
  output: { name: "element", description: "Element" },
  fn: (list, index) => list[index],
});

export const Repeat = partFromSimpleFunction({
  id: "Repeat",
  icon: "fa-list",
  namespace,
  description: "Repeats a value a number of times",
  inputs: [
    { name: "value", description: "Value to repeat" },
    { name: "times", description: "How many times will the value be repeated" },
  ],
  output: { name: "list", description: "List" },
  fn: (value, times) => {
    const list = [];
    for (let i = 0; i < times; i++) {
      list.push(value);
    }
    return list;
  },
});

export const ListFrom2 = partFromSimpleFunction({
  id: "List From 2",
  icon: "fa-list",
  namespace,
  description: "Creates a list from two values",
  inputs: [
    { name: "value1", description: "First value" },
    { name: "value2", description: "Second value" },
  ],
  output: { name: "list", description: "List containing the 2 values" },
  fn: (value1, value2) => [value1, value2],
});

export const ListFrom3 = partFromSimpleFunction({
  id: "List From 3",
  icon: "fa-list",
  namespace,
  description: "Creates a list from three values",
  inputs: [
    { name: "value1", description: "First value" },
    { name: "value2", description: "Second value" },
    { name: "value3", description: "Third value" },
  ],
  output: { name: "list", description: "List containing all 3 values" },
  fn: (value1, value2, value3) => [value1, value2, value3],
});

export const ListFrom4 = partFromSimpleFunction({
  id: "List From 4",
  icon: "fa-list",
  namespace,
  description: "Creates a list from four values",
  inputs: [
    { name: "value1", description: "First value" },
    { name: "value2", description: "Second value" },
    { name: "value3", description: "Third value" },
    { name: "value4", description: "Fourth value" },
  ],
  output: { name: "list", description: "List containing all 4 values" },
  fn: (value1, value2, value3, value4) => [value1, value2, value3, value4],
});

export const ListFrom5 = partFromSimpleFunction({
  id: "List From 5",
  icon: "fa-list",
  namespace,
  description: "Creates a list from five values",
  inputs: [
    { name: "value1", description: "First value" },
    { name: "value2", description: "Second value" },
    { name: "value3", description: "Third value" },
    { name: "value4", description: "Fourth value" },
    { name: "value5", description: "Fifth value" },
  ],
  output: { name: "list", description: "List containing all 5 values" },
  fn: (value1, value2, value3, value4, value5) => [
    value1,
    value2,
    value3,
    value4,
    value5,
  ],
});

export const ConcatLists = partFromSimpleFunction({
  id: "Concat Lists",
  icon: "fa-list",
  namespace,
  description: "Concatenates two lists",
  inputs: [
    { name: "list1", description: "First list" },
    { name: "list2", description: "Second list" },
  ],
  output: { name: "list", description: "Concatenated list" },
  fn: (list1, list2) => [...list1, ...list2],
});

export const Reverse = partFromSimpleFunction({
  id: "Reverse",
  icon: "fa-list",
  namespace,
  description: "Reverses a list",
  inputs: [{ name: "list", description: "List" }],
  output: { name: "reversed", description: "Reversed list" },
  fn: (list) => list.reverse(),
});

export const LoopList: CodePart = {
  id: "Loop List",
  defaultStyle: {
    icon: "fa-list",
  },
  namespace,
  description: "Emits all values in a list",
  inputs: {
    list: { description: "The list to loop" },
  },
  outputs: {
    item: { description: "Will emit a value for each item in the list" },
  },
  fn: (inputs, outputs) => {
    const { list } = inputs;
    const { item } = outputs;
    for (const i of list) {
      item.next(i);
    }
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
  fn: (inputs, outputs) => {
    const { list } = inputs;
    const { head, rest } = outputs;
    head.next(list[0]);
    rest.next(list.slice(1));
  },
};

export const SplitTuple: CodePart = {
  id: "Split Tuple",
  defaultStyle: {
    icon: "fa-list",
  },
  namespace,
  description:
    "Receives a list with 2 items and emits two outputs: the first item and the second item",
  inputs: {
    tuple: { description: "The tuple" },
  },
  outputs: {
    item1: { description: "The first item in the tuple" },
    item2: { description: "The second item in the tuple" },
  },
  fn: (inputs, outputs) => {
    const { list } = inputs;
    const { item1, item2 } = outputs;
    item1.next(list[0]);
    item2.next(list[1]);
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
  fn: (inputs, outputs) => {
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
  fn: (inputs, outputs) => {
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
  fn: (inputs, outputs, adv) => {
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
        "Time to wait before emitting the accumulated values. Default is 500ms",
      mode: "optional",
    },
  },
  reactiveInputs: ["value"],
  outputs: {
    accumulated: { description: "The accumulated values" },
  },
  fn: (inputs, outputs, adv) => {
    const { item, time } = inputs;
    const { r } = outputs;
    const { state } = adv;

    let list = state.get("list") || [];

    if (typeof item !== "undefined") {
      list.push(item);
      state.set("list", list);
    }

    if (state.get("timeout")) {
      clearTimeout(state.get("timeout"));
    }

    state.set(
      "timeout",
      setTimeout(() => {
        r.next(list);
      }, time || 500)
    );
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
  fn: (inputs, outputs, adv) => {
    const { item, count } = inputs;
    const { r } = outputs;
    const { state } = adv;

    let list = state.get("list") || [];

    if (typeof item !== "undefined") {
      list.push(item);
      state.set("list", list);
    }

    if (list.length >= count) {
      r.next(list);
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
  fn: (inputs, outputs, adv) => {
    const { accept, ignore, count } = inputs;
    const { r, i } = outputs;
    const { state } = adv;

    let list = state.get("list") || [];
    let ignored = state.get("ignored") || [];

    if (typeof accept !== "undefined") {
      list.push(accept);
      state.set("list", list);
    }

    if (typeof ignore !== "undefined") {
      ignored.push(ignore);
      state.set("ignored", ignored);
    }

    if (list.length + ignored.length >= count) {
      r.next(list);
      i.next(ignored);
    }
  },
};

export const Append = partFromSimpleFunction({
  id: "Append",
  namespace,
  description: "Appends an item to a list",
  inputs: [
    { name: "list", description: "The list" },
    { name: "item", description: "The item to append" },
  ],
  output: { name: "list", description: "The resulting list" },
  fn: (list, item) => {
    return [...list, item];
  },
});

export const Prepend = partFromSimpleFunction({
  id: "Prepend",
  namespace,
  description: "Prepends an item to a list",
  inputs: [
    { name: "list", description: "The list" },
    { name: "item", description: "The item to prepend" },
  ],
  output: { name: "list", description: "The resulting list" },
  fn: (list, item) => {
    return [item, ...list];
  },
});

export const Remove = partFromSimpleFunction({
  id: "Remove",
  namespace,
  description: "Removes an item from a list",
  inputs: [
    { name: "list", description: "The list" },
    { name: "item", description: "The item to remove" },
  ],
  output: { name: "list", description: "The resulting list" },
  fn: (list, item) => {
    return list.filter((i) => i !== item);
  },
});

export const RemoveAt = partFromSimpleFunction({
  id: "Remove At",
  namespace,
  description: "Removes an item from a list at the specified index",
  inputs: [
    { name: "list", description: "The list" },
    { name: "index", description: "The index of the item to remove" },
  ],
  output: { name: "list", description: "The resulting list" },
  fn: (list, index) => {
    return list.filter((i, idx) => idx !== index);
  },
});

export const Slice = partFromSimpleFunction({
  id: "Slice",
  namespace,
  description:
    "Returns a slice of a list from the specified start index to the specified end index",
  inputs: [
    { name: "list", description: "The list" },
    { name: "start", description: "The index to start slicing from" },
    { name: "end", description: "The index to end slicing at" },
  ],
  output: { name: "list", description: "The resulting list" },
  fn: (list, start, end) => {
    return list.slice(start, end);
  },
});

export const Flatten = partFromSimpleFunction({
  id: "Flatten",
  namespace,
  description: "Flattens a list of lists into a single list",
  inputs: [{ name: "list", description: "The list of lists" }],
  output: { name: "list", description: "The resulting list" },
  fn: (list) => {
    return list.reduce((acc, item) => [...acc, ...item], []);
  },
});
