import {
  fromSimplified,
  Part,
  GroupedPart,
  partInput,
  partOutput,
  NativePart,
  PartInstance,
  CodePart,
  partInstance,
  dynamicPartInput,
  queueInputPinConfig,
  BasePart,
} from "./part";
import { externalConnectionNode, connectionNode } from "./connect";
import { execute, SubjectMap } from "./execute";

import { isDefined, okeys } from "./common";
import { Subject } from "rxjs";
import { PartRepo } from ".";
import { conciseNativePart } from "./test-utils";

export const add: NativePart = {
  id: "add",
  inputs: {
    n1: partInput("number"),
    n2: partInput("number"),
  },
  outputs: {
    r: partOutput("number"),
  },
  fn: ({ n1, n2 }, { r }) => {
    r.next(n1 + n2);
  },
};

export const codeAdd: CodePart = {
  id: "add",
  inputs: {
    n1: partInput("number"),
    n2: partInput("number"),
  },
  outputs: {
    r: partOutput("number"),
  },
  fnCode: `
  outputs.r.next(inputs.n1 + inputs.n2);
    `,
};

export const add1: NativePart = {
  id: "add1",
  inputs: { n: partInput("number") },
  outputs: { r: partOutput("number") },
  fn: ({ n }, { r }) => {
    r.next(n + 1);
  },
};

export const mul: Part = {
  id: "mul",
  inputs: {
    n1: partInput("number"),
    n2: partInput("number"),
  },
  outputs: { r: partOutput("number") },
  fn: ({ n1, n2 }, { r }) => r.next(n1 * n2),
};

export const mul2: Part = fromSimplified({
  id: "mul2",
  inputTypes: { n: "number" },
  outputTypes: { r: "number" },
  fn: ({ n }, { r }) => {
    r.next(n * 2);
  },
});

export const id: Part = fromSimplified({
  id: "id",
  inputTypes: { v: "any" },
  outputTypes: { r: "any" },
  fn: ({ v }, { r }) => {
    r.next(v);
  },
});

export const id2: NativePart = {
  id: "id2",
  inputs: {
    v: partInput(),
  },
  outputs: {
    r: partOutput(),
  },
  fn: ({ v }, { r }) => {
    r.next(v);
  },
};

export const transform: Part = {
  id: "transform",
  inputs: { from: partInput("any"), to: partInput("any") },
  outputs: { r: partOutput("any") },
  fn: ({ to }, { r }, { insId }) => {
    r.next(to);
  },
};

export const Value = (v: any): Part => {
  return fromSimplified({
    id: `val-${v}`,
    inputTypes: {},
    outputTypes: { r: "any" },
    fn: ({}, { r }) => r.next(v),
  });
};

export const add1mul2: GroupedPart = {
  id: "a1m2",
  inputs: {
    n: partInput("number"),
  },
  outputs: {
    r: partOutput("number"),
  },
  inputsPosition: {},
  outputsPosition: {},
  instances: [partInstance("a", add1), partInstance("b", mul2)],
  connections: [
    {
      from: externalConnectionNode("n"),
      to: connectionNode("a", "n"),
    },
    {
      from: connectionNode("a", "r"),
      to: connectionNode("b", "n"),
    },
    {
      from: connectionNode("b", "r"),
      to: externalConnectionNode("r"),
    },
  ],
};

export const add1mul2add1: GroupedPart = {
  id: "a1m2a1",
  inputs: {
    n: partInput("number"),
  },
  outputs: {
    r: partOutput("number"),
  },
  inputsPosition: {},
  outputsPosition: {},
  instances: [partInstance("a", add1), partInstance("b", mul2), partInstance("c", add1)],
  connections: [
    {
      from: externalConnectionNode("n"),
      to: connectionNode("a", "n"),
    },
    {
      from: connectionNode("a", "r"),
      to: connectionNode("b", "n"),
    },
    {
      from: connectionNode("b", "r"),
      to: connectionNode("c", "n"),
    },
    {
      from: connectionNode("c", "r"),
      to: externalConnectionNode("r"),
    },
  ],
};

export const addGrouped: GroupedPart = {
  id: "add-grouped",
  inputsPosition: {},
  outputsPosition: {},
  inputs: {
    n1: partInput("number"),
    n2: partInput("number"),
  },
  outputs: {
    r: partOutput("number"),
  },
  instances: [partInstance("a", add)],
  connections: [
    {
      from: externalConnectionNode("n1"),
      to: connectionNode("a", "n1"),
    },
    {
      from: externalConnectionNode("n2"),
      to: connectionNode("a", "n2"),
    },
    {
      from: connectionNode("a", "r"),
      to: externalConnectionNode("r"),
    },
  ],
};

export const addGroupedQueued: GroupedPart = {
  id: "add-grouped-queued",
  inputsPosition: {},
  outputsPosition: {},
  inputs: {
    n1: partInput("number"),
    n2: partInput("number"),
  },
  outputs: {
    r: partOutput("number"),
  },
  instances: [partInstance("a", add, { n1: queueInputPinConfig(), n2: queueInputPinConfig() })],
  connections: [
    {
      from: externalConnectionNode("n1"),
      to: connectionNode("a", "n1"),
    },
    {
      from: externalConnectionNode("n2"),
      to: connectionNode("a", "n2"),
    },
    {
      from: connectionNode("a", "r"),
      to: externalConnectionNode("r"),
    },
  ],
};

export const optAdd: NativePart = {
  id: "optAdd",
  inputs: {
    n1: { type: "number" },
    n2: { type: "number", mode: "required-if-connected" },
  },
  outputs: {
    r: { type: "number" },
  },
  fn: ({ n1, n2 }, { r }) => {
    const n2Norm = typeof n2 === "undefined" ? 42 : n2;
    r.next(n1 + n2Norm);
  },
};

export const isEven: NativePart = {
  id: "is-even",
  inputs: {
    item: { type: "any" },
    idx: { type: "number", mode: "required-if-connected" },
  },
  outputs: {
    r: { type: "boolean" },
  },
  fn: ({ item }, { r }) => {
    r.next(item % 2 === 0);
  },
};

export const filter: Part = fromSimplified({
  id: "filter",
  inputTypes: { list: "any", fn: "part" },
  outputTypes: { r: "any" },
  fn: ({ list, fn }, o) => {
    let newList: any[] = [];

    const uns: any[] = [];

    list.forEach((item: any, idx: number) => {
      const itemInput = dynamicPartInput();
      const outputs = okeys(fn.outputs).reduce<SubjectMap>(
        (p, k) => ({ ...p, [k]: new Subject() }),
        {}
      );
      const clean = execute({part: fn, inputs: { item: itemInput }, outputs: outputs, partsRepo: testRepo});
      outputs.r.subscribe((bool) => {
        if (bool) {
          newList.push(item);
        }
      });

      okeys(outputs)
        .filter((k) => k !== "r")
        .forEach((k) => {
          outputs[k].subscribe(() => {
            o.rs.next({ key: k, v: item, idx });
          });
        });

      itemInput.subject.next(item);
      uns.push(clean);
    });

    o.r.next(newList);

    return () => uns.forEach((fn) => fn());
  },
});

export const peq: NativePart = {
  id: "peq",
  inputs: { val: partInput("any"), compare: partInput("string") },
  outputs: { r: partOutput("any"), else: partOutput("any", false, true) },
  fn: ({ val, compare }, o) => {
    if (val === compare) {
      o.r.next(val);
    } else {
      o.else.next(val);
    }
  },
};

export const delay5 = conciseNativePart({
  id: "delay5",
  inputs: ["item"],
  outputs: ["r"],
  completionOutputs: ["r"],
  fn: ({ item }, { r }) => {
    setTimeout(() => {
      r.next(item);
    }, 5);
  },
});

export const delay = conciseNativePart({
  id: "delay5",
  inputs: ["item", "ms"],
  outputs: ["r"],
  completionOutputs: ["r"],
  fn: ({ item, ms }, { r }) => {
    setTimeout(() => {
      r.next(item);
    }, ms);
  },
});

export const testRepo = {
  add,
  add1,
  mul2: mul2,
  mul,
  a1m2: add1mul2,
  [isEven.id]: isEven,
  [id.id]: id,
  [id2.id]: id2,
  [optAdd.id]: optAdd,
  [transform.id]: transform,
  peq,
  delay,
};

export const accumulate = conciseNativePart({
  id: "accumulate",
  inputs: ["count|required", "val|optional"],
  outputs: ["r"],
  reactiveInputs: ["val"],
  completionOutputs: ["r"],
  fn: (inputs, outputs, adv) => {
    const { count, val } = inputs;
    const { r } = outputs;

    const { state } = adv;

    let list = state.get("list") || [];

    if (count !== state.get("count")) {
      list = [];
      state.set("count", count);
    }

    if (isDefined(val)) {
      list.push(val);
    }

    state.set("list", list);

    if (list.length === state.get("count")) {
      r.next(list);
    }
  },
});

export const accUntil: NativePart = {
  id: "accUntil",
  inputs: {
    item: partInput("any", "optional"),
    until: partInput("any", "optional"),
  },
  outputs: {
    r: partOutput("number"),
  },
  reactiveInputs: ["item", "until"],
  completionOutputs: ["r"],
  fn: ({ item, until }, { r }, { state }) => {
    let list = state.get("list") || [];

    if (isDefined(item)) {
      list.push(item);
      state.set("list", list);
    }

    if (isDefined(until)) {
      r.next(list);
    }
  },
};

export const spreadList = conciseNativePart({
  id: "SpreadList",
  inputs: ["list"],
  outputs: ["val", "idx", "length"],
  fn: (inputs, outputs) => {
    // magic here
    const { list } = inputs;
    const { val, idx, length } = outputs;
    list.forEach((v, i) => {
      val.next(v);
      idx.next(i);
    });
    length.next(list.length);
  },
});

export const testRepoWith = (...parts: Part[]): PartRepo => {
  return parts.reduce<PartRepo>((acc, p) => ({ ...acc, [p.id]: p }), testRepo);
};
