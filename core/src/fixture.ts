import {
  InternalNode,
  InternalVisualNode,
  nodeInput,
  nodeOutput,
  InternalCodeNode,
  internalNodeInstance,
  dynamicNodeInput,
  queueInputPinConfig,
} from "./node";
import { externalConnectionNode, connectionNode } from "./connect/helpers";
import { execute, SubjectMap } from "./execute";

import { isDefined, keys } from "./common";
import { Subject } from "rxjs";
import { conciseCodeNode, fromSimplified, valueNode } from "./test-utils";

export const add: InternalCodeNode = {
  id: "add",
  inputs: {
    n1: nodeInput(),
    n2: nodeInput(),
  },
  outputs: {
    r: nodeOutput(),
  },
  run: ({ n1, n2 }, { r }) => {
    r?.next(n1 + n2);
  },
};

export const add1: InternalCodeNode = {
  id: "add1",
  inputs: { n: nodeInput() },
  outputs: { r: nodeOutput() },
  run: ({ n }, { r }) => {
    r?.next(n + 1);
  },
};

export const mul: InternalNode = {
  id: "mul",
  inputs: {
    n1: nodeInput(),
    n2: nodeInput(),
  },
  outputs: { r: nodeOutput() },
  run: ({ n1, n2 }, { r }) => r?.next(n1 * n2),
};

export const mul2: InternalNode = fromSimplified({
  id: "mul2",
  inputTypes: { n: "number" },
  outputTypes: { r: "number" },
  run: ({ n }, { r }) => {
    r?.next(n * 2);
  },
});

export const id: InternalNode = {
  id: "id",
  inputs: { v: nodeInput() },
  outputs: { r: nodeOutput() },
  run: ({ v }, { r }) => {
    r?.next(v);
  },
  completionOutputs: ["r"],
};

export const id2: InternalCodeNode = {
  id: "id2",
  inputs: {
    v: nodeInput(),
  },
  outputs: {
    r: nodeOutput(),
  },
  run: ({ v }, { r }) => {
    r?.next(v);
  },
};

export const transform: InternalNode = {
  id: "transform",
  inputs: { from: nodeInput(), to: nodeInput() },
  outputs: { r: nodeOutput() },
  run: ({ to }, { r }) => {
    r?.next(to);
  },
};

export const Value = (v: any): InternalNode => {
  return fromSimplified({
    id: `val-${v}`,
    inputTypes: {},
    outputTypes: { r: "any" },
    run: ({}, { r }) => r?.next(v),
  });
};

export const add1mul2: InternalVisualNode = {
  id: "a1m2",
  inputs: {
    n: nodeInput(),
  },
  outputs: {
    r: nodeOutput(),
  },

  instances: [internalNodeInstance("a", add1), internalNodeInstance("b", mul2)],
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

export const add1mul2add1: InternalVisualNode = {
  id: "a1m2a1",
  inputs: {
    n: nodeInput(),
  },
  outputs: {
    r: nodeOutput(),
  },
  instances: [
    internalNodeInstance("a", add1),
    internalNodeInstance("b", mul2),
    internalNodeInstance("c", add1),
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

export const addGrouped: InternalVisualNode = {
  id: "add-visual",
  inputs: {
    n1: nodeInput(),
    n2: nodeInput(),
  },
  outputs: {
    r: nodeOutput(),
  },
  instances: [internalNodeInstance("a", add)],
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

export const addGroupedQueued: InternalVisualNode = {
  id: "add-visual-queued",

  inputs: {
    n1: nodeInput(),
    n2: nodeInput(),
  },
  outputs: {
    r: nodeOutput(),
  },
  instances: [
    internalNodeInstance("a", add, {
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

export const optAdd: InternalCodeNode = {
  id: "optAdd",
  inputs: {
    n1: {},
    n2: { mode: "required-if-connected" },
  },
  outputs: {
    r: {},
  },
  run: ({ n1, n2 }, { r }) => {
    const n2Norm = typeof n2 === "undefined" ? 42 : n2;
    r?.next(n1 + n2Norm);
  },
};

export const isEven: InternalCodeNode = {
  id: "is-even",
  inputs: {
    item: {},
    idx: { mode: "required-if-connected" },
  },
  outputs: {
    r: {},
  },
  run: ({ item }, { r }) => {
    r?.next(item % 2 === 0);
  },
};

export const filter: InternalNode = fromSimplified({
  id: "filter",
  inputTypes: { list: "any", fn: "node" },
  outputTypes: { r: "any" },
  run: ({ list, fn }, o) => {
    let newList: any[] = [];

    const uns: any[] = [];

    list.forEach((item: any, idx: number) => {
      const itemInput = dynamicNodeInput();
      const outputs = keys(fn.outputs).reduce<SubjectMap>(
        (p, k) => ({ ...p, [k]: new Subject() }),
        {}
      );
      const clean = execute({
        node: fn,
        inputs: { item: itemInput },
        outputs: outputs,
      });
      outputs.r?.subscribe((bool) => {
        if (bool) {
          newList.push(item);
        }
      });

      keys(outputs)
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

export const peq: InternalCodeNode = {
  id: "peq",
  inputs: { val: nodeInput(), compare: nodeInput() },
  outputs: { r: nodeOutput(), else: nodeOutput() },
  run: ({ val, compare }, o) => {
    if (val === compare) {
      o.r?.next(val);
    } else {
      o.else?.next(val);
    }
  },
};

export const delay5 = conciseCodeNode({
  id: "delay5",
  inputs: ["item"],
  outputs: ["r"],
  completionOutputs: ["r"],
  run: ({ item }, { r }) => {
    setTimeout(() => {
      r?.next(item);
    }, 5);
  },
});

export const delay = conciseCodeNode({
  id: "delay5",
  inputs: ["item", "ms"],
  outputs: ["r"],
  completionOutputs: ["r"],
  run: ({ item, ms }, { r }) => {
    setTimeout(() => {
      r?.next(item);
    }, ms);
  },
});

export const zero = valueNode("zero", 0);
export const one = valueNode("one", 1);
export const mOne = valueNode("mOne", -1);

export const accumulate = conciseCodeNode({
  id: "accumulate",
  inputs: ["count|required", "val|optional"],
  outputs: ["r"],
  reactiveInputs: ["val"],
  completionOutputs: ["r"],
  run: (inputs, outputs, adv) => {
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
    console.log("list", list, state.get("count"));
    if (list.length === state.get("count")) {
      r?.next(list);
    }
  },
});

export const spreadList = conciseCodeNode({
  id: "SpreadList",
  inputs: ["list"],
  outputs: ["val", "idx", "length"],
  run: (inputs, outputs) => {
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
