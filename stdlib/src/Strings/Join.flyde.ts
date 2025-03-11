import { InternalCodeNode } from "@flyde/core";

const namespace = "Strings";

export const Join: InternalCodeNode = {
  id: "Join",
  defaultStyle: { icon: "fa-font" },
  namespace,
  description: "Joins an array of strings",
  inputs: {
    array: { description: "Array to join" },
    separator: { description: "Separator" },
  },
  outputs: { value: { description: "Joined value" } },
  run: ({ array, separator }, { value }) => value.next(array.join(separator)),
};
