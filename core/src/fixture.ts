import {
  fromSimplified,
  Part,
  VisualPart,
  partInput,
  partOutput,
  CodePart,
  InlineValuePart,
  partInstance,
  dynamicPartInput,
  queueInputPinConfig,
} from "./part";
import { externalConnectionNode, connectionNode } from "./connect";
import { execute, SubjectMap } from "./execute";

import { isDefined, okeys } from "./common";
import { Subject } from "rxjs";
import { PartRepo } from ".";
import { conciseCodePart } from "./test-utils";

export const add: CodePart = {
  id: "add",
  inputs: {
    n1: partInput(),
    n2: partInput(),
  },
  outputs: {
    r: partOutput(),
  },
  fn: ({ n1, n2 }, { r }) => {
    r?.next(n1 + n2);
  },
};

export const codeAdd: InlineValuePart = {
  id: "add",
  inputs: {
    n1: partInput(),
    n2: partInput(),
  },
  outputs: {
    r: partOutput(),
  },
  fnCode: `
  outputs.r?.next(inputs.n1 + inputs.n2);
    `,
};

export const add1: CodePart = {
  id: "add1",
  inputs: { n: partInput() },
  outputs: { r: partOutput() },
  fn: ({ n }, { r }) => {
    r?.next(n + 1);
  },
};

export const mul: Part = {
  id: "mul",
  inputs: {
    n1: partInput(),
    n2: partInput(),
  },
  outputs: { r: partOutput() },
  fn: ({ n1, n2 }, { r }) => r?.next(n1 * n2),
};

export const mul2: Part = fromSimplified({
  id: "mul2",
  inputTypes: { n: "number" },
  outputTypes: { r: "number" },
  fn: ({ n }, { r }) => {
    r?.next(n * 2);
  },
});

export const id: Part = {
  id: "id",
  inputs: { v: partInput() },
  outputs: { r: partOutput() },
  fn: ({ v }, { r }) => {
    r?.next(v);
  },
  completionOutputs: ["r"],
};

export const id2: CodePart = {
  id: "id2",
  inputs: {
    v: partInput(),
  },
  outputs: {
    r: partOutput(),
  },
  fn: ({ v }, { r }) => {
    r?.next(v);
  },
};

export const transform: Part = {
  id: "transform",
  inputs: { from: partInput(), to: partInput() },
  outputs: { r: partOutput() },
  fn: ({ to }, { r }) => {
    r?.next(to);
  },
};

export const Value = (v: any): Part => {
  return fromSimplified({
    id: `val-${v}`,
    inputTypes: {},
    outputTypes: { r: "any" },
    fn: ({}, { r }) => r?.next(v),
  });
};

export const add1mul2: VisualPart = {
  id: "a1m2",
  inputs: {
    n: partInput(),
  },
  outputs: {
    r: partOutput(),
  },
  inputsPosition: {},
  outputsPosition: {},
  instances: [partInstance("a", add1.id), partInstance("b", mul2.id)],
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

export const add1mul2add1: VisualPart = {
  id: "a1m2a1",
  inputs: {
    n: partInput(),
  },
  outputs: {
    r: partOutput(),
  },
  inputsPosition: {},
  outputsPosition: {},
  instances: [
    partInstance("a", add1.id),
    partInstance("b", mul2.id),
    partInstance("c", add1.id),
  ],
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

export const addGrouped: VisualPart = {
  id: "add-visual",
  inputsPosition: {},
  outputsPosition: {},
  inputs: {
    n1: partInput(),
    n2: partInput(),
  },
  outputs: {
    r: partOutput(),
  },
  instances: [partInstance("a", add.id)],
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

export const addGroupedQueued: VisualPart = {
  id: "add-visual-queued",
  inputsPosition: {},
  outputsPosition: {},
  inputs: {
    n1: partInput(),
    n2: partInput(),
  },
  outputs: {
    r: partOutput(),
  },
  instances: [
    partInstance("a", add.id, {
      n1: queueInputPinConfig(),
      n2: queueInputPinConfig(),
    }),
  ],
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

export const optAdd: CodePart = {
  id: "optAdd",
  inputs: {
    n1: { },
    n2: { mode: "required-if-connected" },
  },
  outputs: {
    r: { },
  },
  fn: ({ n1, n2 }, { r }) => {
    const n2Norm = typeof n2 === "undefined" ? 42 : n2;
    r?.next(n1 + n2Norm);
  },
};

export const isEven: CodePart = {
  id: "is-even",
  inputs: {
    item: { },
    idx: { mode: "required-if-connected" },
  },
  outputs: {
    r: { },
  },
  fn: ({ item }, { r }) => {
    r?.next(item % 2 === 0);
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
      const clean = execute({
        part: fn,
        inputs: { item: itemInput },
        outputs: outputs,
        partsRepo: testRepo,
      });
      outputs.r?.subscribe((bool) => {
        if (bool) {
          newList.push(item);
        }
      });

      okeys(outputs)
        .filter((k) => k !== "r")
        .forEach((k) => {
          outputs[k]?.subscribe(() => {
            o.rs?.next({ key: k, v: item, idx });
          });
        });

      itemInput.subject.next(item);
      uns.push(clean);
    });

    o.r?.next(newList);

    return () => uns.forEach((fn) => fn());
  },
});

export const peq: CodePart = {
  id: "peq",
  inputs: { val: partInput(), compare: partInput() },
  outputs: { r: partOutput(), else: partOutput() },
  fn: ({ val, compare }, o) => {
    if (val === compare) {
      o.r?.next(val);
    } else {
      o.else?.next(val);
    }
  },
};

export const delay5 = conciseCodePart({
  id: "delay5",
  inputs: ["item"],
  outputs: ["r"],
  completionOutputs: ["r"],
  fn: ({ item }, { r }) => {
    setTimeout(() => {
      r?.next(item);
    }, 5);
  },
});

export const delay = conciseCodePart({
  id: "delay5",
  inputs: ["item", "ms"],
  outputs: ["r"],
  completionOutputs: ["r"],
  fn: ({ item, ms }, { r }) => {
    setTimeout(() => {
      r?.next(item);
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

export const accumulate = conciseCodePart({
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

    console.log('called', val, state);
    

    if (list.length === state.get("count")) {
      console.log(list);
      
      r?.next(list);
    }
  },
});

export const accUntil: CodePart = {
  id: "accUntil",
  inputs: {
    item: partInput('optional'),
    until: partInput('optional'),
  },
  outputs: {
    r: partOutput(),
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
      r?.next(list);
    }
  },
};

export const spreadList = conciseCodePart({
  id: "SpreadList",
  inputs: ["list"],
  outputs: ["val", "idx", "length"],
  fn: (inputs, outputs) => {
    // magic here
    const { list } = inputs;
    const { val, idx, length } = outputs;
    list.forEach((v: any, i: any) => {
      val?.next(v);
      idx?.next(i);
    });
    length?.next(list.length);
  },
});

export const testRepoWith = (...parts: Part[]): PartRepo => {
  return parts.reduce<PartRepo>((acc, p) => ({ ...acc, [p.id]: p }), testRepo);
};
