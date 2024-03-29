import { CodeNode } from "@flyde/core";

export const node: CodeNode = {
  id: "IdWithCleanup",
  inputs: {
    n: { mode: "required" },
  },
  outputs: {
    r: {},
  },
  run: ({ n }, { r }, adv) => {
    adv.onCleanup(() => {
      adv.context.cleanupSpy();
    });
    r?.next(n);
  },
};
