import { InternalCodeNode } from "@flyde/core";

const namespace = "Lists";

export const Repeat: InternalCodeNode = {
  id: "Repeat",
  icon: "fa-list",
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
