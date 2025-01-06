import { CodeNode } from "@flyde/core";

const namespace = "Strings";

export const Concat: CodeNode = {
  id: "Concat",
  defaultStyle: {
    icon: "fa-font",
  },
  namespace,
  description: "Concatenates two strings",
  inputs: {
    a: { description: "String a" },
    b: { description: "String b" },
  },
  outputs: { value: { description: "Concatenated value" } },
  run: ({ a, b }, { value }) => value.next(a + b),
};
