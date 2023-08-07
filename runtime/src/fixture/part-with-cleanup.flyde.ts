import { CodeNode } from "@flyde/core";

export const part: CodeNode = {
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
