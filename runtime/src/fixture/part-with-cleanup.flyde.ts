import { CodePart } from "@flyde/core";

const part: CodePart = {
  id: "IdWithCleanup",
  inputs: {
    n: { mode: "required"},
  },
  outputs: {
    r: {},
  },
  fn: ({ n }, { r }, adv) => {
    adv.onCleanup(() => {
      adv.context.cleanupSpy();
    });
    r?.next(n);
  },
};

export = part;
