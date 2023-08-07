import { produce } from "immer";
import { randomInt, randomPos, shuffle } from "../../common";
import { assert } from "chai";
import { hashFlow, hashNode } from ".";
import {
  InlineValueNode,
  nodeInput,
  nodeInstance,
  nodeOutput,
  VisualNode,
  visualNode,
} from "../../node";
import { FlydeFlow } from "../../flow-schema";
import { connectionData } from "../../connect";

const someNode: VisualNode = {
  id: "bob",
  inputs: {
    a: nodeInput(),
  },
  outputs: {
    r: nodeOutput(),
  },
  connections: [
    connectionData("i2.r", "i3.v"),
    connectionData("i3.r", "i4.v"),
    connectionData("i4.r", "i5.v"),
  ],
  instances: [
    nodeInstance("i1", "someNode", undefined, { x: 14, y: 28 }),
    nodeInstance("i2", "someNode", undefined, { x: 14, y: 28 }),
    nodeInstance("i3", "someNode", undefined, { x: 14, y: 28 }),
  ],
  inputsPosition: { a: { x: 20, y: 20 } },
  outputsPosition: { r: { x: 20, y: 500 } },
};

describe("nodes hasher", () => {
  describe("visual node", () => {
    it("creates difference hash for different id", () => {
      const p2 = produce(someNode, (d) => {
        d.id = `${d.id}-${randomInt}`;
      });

      const h1 = hashNode(someNode);
      const h2 = hashNode(p2);

      assert.notEqual(h1, h2);
    });

    it("creates difference hash for different instances", () => {
      const p2 = produce(someNode, (d) => {
        d.instances.push(nodeInstance("i7", "someNode"));
      });

      const h1 = hashNode(someNode);
      const h2 = hashNode(p2);

      assert.notEqual(h1, h2);
    });

    it("creates difference hash for different connections", () => {
      const p2 = produce(someNode, (d) => {
        d.connections.push(d.connections[0]!);
      });

      const h1 = hashNode(someNode);
      const h2 = hashNode(p2);

      assert.notEqual(h1, h2);
    });

    it("hashes nodes disregarding i/o position", () => {
      const node2 = produce(someNode, (draft) => {
        draft.inputsPosition.a = randomPos();
        draft.outputsPosition.r = randomPos();
      });

      const h1 = hashNode(someNode);
      const h2 = hashNode(node2);

      assert.equal(h1, h2);
    });

    it("hashes nodes disregarding instance position when ignore enabled", () => {
      const node2 = produce(someNode, (draft) => {
        draft.instances[0]!.pos = randomPos();
      });

      const h1 = hashNode(someNode);
      const h2 = hashNode(node2);

      assert.equal(h1, h2);
    });

    it("disregards order of instances and connections", () => {
      const node2 = produce(someNode, (draft) => {
        draft.instances = shuffle(draft.instances);
        draft.connections = shuffle(draft.connections);
      });

      const h1 = hashNode(someNode);
      const h2 = hashNode(node2);

      assert.equal(h1, h2);
    });

    it("considers completion outputs", () => {
      const p2 = produce(someNode, (draft) => {
        draft.completionOutputs = ["bob"];
      });

      const h1 = hashNode(someNode);
      const h2 = hashNode(p2);

      assert.notEqual(h1, h2);
    });

    it("considers reactive inputs", () => {
      const p2 = produce(someNode, (draft) => {
        draft.reactiveInputs = ["bob"];
      });

      const h1 = hashNode(someNode);
      const h2 = hashNode(p2);

      assert.notEqual(h1, h2);
    });

    it("considers different inputs", () => {
      const p2 = produce(someNode, (draft) => {
        draft.inputs.bob2 = nodeInput();
      });

      const h1 = hashNode(someNode);
      const h2 = hashNode(p2);

      assert.notEqual(h1, h2);
    });

    it("considers different outputs", () => {
      const p2 = produce(someNode, (draft) => {
        draft.outputs.bob2 = nodeInput();
      });

      const h1 = hashNode(someNode);
      const h2 = hashNode(p2);

      assert.notEqual(h1, h2);
    });
  });

  describe("code node", () => {
    const base: InlineValueNode = {
      id: "bob2",
      runFnRawCode: `some codez`,
      customViewCode: "bob",
      inputs: {},
      outputs: {},
    };

    it("considers fn code code node properly", () => {
      const p2 = produce(base, (d) => {
        d.runFnRawCode = "dbdfgfdg";
      });

      const h1 = hashNode(base);
      const h2 = hashNode(p2);

      assert.notEqual(h1, h2);
    });

    it("considers code view fn properly", () => {
      const p2 = produce(base, (d) => {
        d.customViewCode = "dbdfgfdg";
      });

      const h1 = hashNode(base);
      const h2 = hashNode(p2);

      assert.notEqual(h1, h2);
    });
  });
});

describe("flow hasher", () => {
  it("emits same hash for same flow", () => {
    const f1: FlydeFlow = {
      imports: {
        a: ["b"],
        c: ["d"],
      },
      node: visualNode({ id: "bob" }),
    };

    const f2: FlydeFlow = {
      imports: {
        c: ["d"],
        a: ["b"],
      },
      node: visualNode({ id: "bob" }),
    };

    assert.equal(hashFlow(f1), hashFlow(f2));
  });

  it("emits different hash for different node", () => {
    const f1: FlydeFlow = {
      imports: {
        a: ["b"],
        c: ["d"],
      },
      node: visualNode({ id: "bob" }),
    };

    const f2: FlydeFlow = {
      imports: {
        c: ["d"],
        a: ["b"],
      },
      node: visualNode({ id: "bob2" }),
    };

    assert.notEqual(hashFlow(f1), hashFlow(f2));
  });
});
