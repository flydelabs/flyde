import {
  InternalCodeNode,
  NodeInstanceError,
  InternalVisualNode,
  DynamicNodeInput,
  InternalNodeInstance,
} from ".";

import { nodeInput, nodeOutput } from "./node";

import { internalNodeInstance } from "./types/internal";
import {
  dynamicNodeInput,
  dynamicOutput,
  dynamicNodeInputs,
} from "./types/pins";

import { assert } from "chai";

import { spy } from "sinon";

import jg from "jsdom-global";

import { Subject } from "rxjs";
import {
  delay,
  eventually,
  isDefined,
  pickRandom,
  randomInt,
  randomInts,
  repeat,
  shuffle,
} from "./common";
import {
  composeExecutableNode,
  connectionNode,
  externalConnectionNode,
  connection,
  connectionData,
  ERROR_PIN_ID,
  TRIGGER_PIN_ID,
} from "./connect";
import { queueInputPinConfig, stickyInputPinConfig } from "./node";
import { execute } from "./execute";
import {
  add1,
  mul2,
  Value,
  add,
  transform,
  id,
  addGrouped,
  optAdd,
  filter,
  isEven,
  add1mul2,
  peq,
  mul,
  addGroupedQueued,
  id2,
  accumulate,
  spreadList,
  zero,
  one,
  mOne,
} from "./fixture";

import {
  conciseNode,
  conciseCodeNode,
  callsFirstArgs,
  valueNode,
  spiedOutput,
  wrappedOnEvent,
  fromSimplified,
} from "./test-utils";
import { DebuggerEventType } from "./execute/debugger";

describe("main ", () => {
  let cleanups: any[] = [];

  beforeEach(() => {
    if (cleanups) {
      cleanups.push(jg());
    }
  });

  afterEach(() => {
    if (cleanups) {
      cleanups.forEach((fn) => fn());
      cleanups = [];
    }
  });

  describe("core", () => {
    it("runs an Id internal code node properly", () => {
      const node: InternalCodeNode = {
        id: "id",
        inputs: {
          v: nodeInput(),
        },
        outputs: {
          r: nodeInput(),
        },
        run: ({ v }, { r }) => {
          r?.next(v);
        },
      };

      const s = spy();
      const v = dynamicNodeInput();
      const r = dynamicOutput();

      r.subscribe(s);
      execute({
        node: node,
        inputs: { v },
        outputs: { r },
      });
      v.subject.next(2);
      assert.equal(s.calledOnceWithExactly(2), true);
    });

    it("runs an ADD internal code node properly", () => {
      const innerSpy = spy();
      const node: InternalCodeNode = {
        id: "add",
        inputs: {
          a: nodeInput(),
          b: nodeInput(),
        },
        outputs: {
          r: nodeInput(),
        },
        run: (args, { r }, {}) => {
          innerSpy();
          r?.next(args.a + args.b);
        },
      };

      const s = spy();
      const a = dynamicNodeInput();
      const b = dynamicNodeInput();
      const r = dynamicOutput();

      r.subscribe(s);
      execute({
        node: node,
        inputs: { a, b },
        outputs: { r },
      });
      a.subject.next(2);
      b.subject.next(3);
      assert.equal(s.calledOnceWithExactly(5), true);
      assert.equal(s.callCount, 1);
      assert.equal(innerSpy.callCount, 1);
      a.subject.next(3);
      b.subject.next(4);
      assert.equal(s.callCount, 2);
      assert.equal(s.calledWithExactly(7), true);
    });

    it("works with a simple visual node", () => {
      const n1 = dynamicNodeInput();
      const n2 = dynamicNodeInput();
      const r = new Subject();
      const s = spy();
      r.subscribe(s);
      execute({
        node: addGrouped,
        inputs: { n1, n2 },
        outputs: { r },
      });
      const num1 = randomInt(1, 100);
      const num2 = randomInt(1, 100);
      n1.subject.next(num1);
      n2.subject.next(num2);
      assert.equal(s.callCount, 1);
      assert.equal(s.lastCall.args[0], num1 + num2);
    });

    it("works with nested nodes", () => {
      const add1mul2twice = {
        id: "a1m2x2",
        instances: [
          internalNodeInstance("p1", add1mul2),
          internalNodeInstance("p2", add1mul2),
        ],
        connections: [
          {
            from: connectionNode("p1", "r"),
            to: connectionNode("p2", "n"),
          },
          connectionData("n", "p1.n"),
          connectionData("p2.r", "r"),
        ],
        inputs: {
          n: nodeInput(),
        },
        outputs: {
          r: nodeOutput(),
        },
      };

      const node = composeExecutableNode(add1mul2twice);

      const fn = spy();
      const n = dynamicNodeInput();
      const r = dynamicOutput();
      execute({
        node: node,
        inputs: { n },
        outputs: { r },
      });
      r.subscribe(fn);

      n.subject.next(20); // ((21 * 2) + 1) * 2

      assert.deepEqual(Object.keys(node.inputs), ["n"]);
      assert.deepEqual(Object.keys(node.outputs), ["r"]);
      assert.equal(fn.lastCall.args[0], 86);
    });

    describe("optional inputs", () => {
      it("runs nodes with optional pins that were left unconnected", () => {
        const node = composeExecutableNode({
          id: "bob",
          instances: [internalNodeInstance("a", optAdd)],
          connections: [
            connectionData("n1", "a.n1"),
            connectionData("a.r", "r"),
          ],
          inputs: {
            n1: nodeInput(),
          },
          outputs: {
            r: nodeOutput(),
          },
        });

        const n1 = dynamicNodeInput();
        const s = spy();
        const r = dynamicOutput();
        execute({
          node: node,
          inputs: { n1 },
          outputs: { r },
        });
        r.subscribe(s);
        n1.subject.next(42);
        assert.equal(s.lastCall.args[0], 84);
      });

      it("runs nodes with optional pins that were connected", () => {
        const node = composeExecutableNode({
          id: "bob",
          instances: [internalNodeInstance("a", optAdd)],
          inputs: {
            n1: nodeInput(),
            n2: nodeInput(),
          },
          outputs: {
            r: nodeOutput(),
          },
          connections: [
            connectionData("n1", "a.n1"),
            connectionData("n2", "a.n2"),
            connectionData("a.r", "r"),
          ],
        });

        const n1 = dynamicNodeInput();
        const n2 = dynamicNodeInput();
        const s = spy();
        const r = dynamicOutput();
        execute({
          node: node,
          inputs: { n1, n2 },
          outputs: { r },
        });
        r.subscribe(s);
        n2.subject.next(1);
        n1.subject.next(2);
        assert.equal(s.lastCall.args[0], 3);
      });

      it("resolves dependencies properly", () => {
        // here there are 2 constants, 42 and 5, connected
        // to an "add" node that has n2 as an optional input
        // this case both n1 and n2 are given, so it's expected
        // to wait for "n2" or at least consider it

        // eventually I solved it by making sure that the constant for n2 is called first.
        // Not ideal at all!
        const node = composeExecutableNode({
          id: "bob",
          instances: [
            internalNodeInstance("b", Value(5)),
            internalNodeInstance("v", Value(42)),
            internalNodeInstance("a", optAdd),
          ],
          connections: [
            connectionData(["b", "r"], ["a", "n2"]),
            connectionData(["v", "r"], ["a", "n1"]),
            connectionData("a.r", "r"),
          ],
          inputs: {},
          outputs: {
            r: nodeOutput(),
          },
        });

        const s = spy();
        const r = dynamicOutput();
        r.subscribe(s);
        execute({
          node: node,
          inputs: {},
          outputs: { r },
        });
        assert.equal(s.lastCall.args[0], 47);
      });
    });

    describe("composeExecutableNode", () => {
      it("runs pieces in an isolate environment for each execution", () => {
        const p1 = composeExecutableNode({
          id: "test",
          instances: [internalNodeInstance("a", add1)],
          inputs: {
            n: nodeInput(),
          },
          outputs: {
            r: nodeOutput(),
          },
          connections: [connectionData("n", "a.n"), connectionData("a.r", "r")],
        });

        const n = dynamicNodeInput();
        const s1 = spy();
        const r1 = dynamicOutput();
        execute({
          node: p1,
          inputs: { n },
          outputs: { r: r1 },
        });
        r1.subscribe(s1);

        const s2 = spy();
        const r2 = dynamicOutput();
        execute({
          node: p1,
          inputs: { n },
          outputs: { r: r2 },
        });
        r2.subscribe(s2);

        n.subject.next(2);
        assert.equal(s1.lastCall.args[0], 3);
        assert.equal(s2.lastCall.args[0], 3);
        assert.equal(s1.callCount, 1);
        assert.equal(s2.callCount, 1);
      });

      it("connects 2 pieces and runs it", () => {
        const add1mul2: InternalVisualNode = {
          id: "test",
          instances: [
            internalNodeInstance("a", add1),
            internalNodeInstance("b", mul2),
          ],
          connections: [
            {
              from: connectionNode("a", "r"),
              to: connectionNode("b", "n"),
            },
            {
              from: externalConnectionNode("n"),
              to: connectionNode("a", "n"),
            },
            {
              from: connectionNode("b", "r"),
              to: externalConnectionNode("r"),
            },
          ],
          inputs: {
            n: nodeInput(),
          },
          outputs: {
            r: nodeOutput(),
          },
        };

        const fn = spy();

        const node = composeExecutableNode(add1mul2);

        const n = dynamicNodeInput();
        const r = new Subject();

        assert.deepEqual(Object.keys(node.inputs), ["n"]);
        assert.deepEqual(Object.keys(node.outputs), ["r"]);

        r.subscribe(fn);

        execute({
          node: node,
          inputs: { n },
          outputs: { r },
        });

        assert.equal(fn.callCount, 0);
        n.subject.next(2);
        assert.equal(fn.callCount, 1);
        assert.equal(fn.lastCall.args[0], 6);

        n.subject.next(7);

        assert.equal(fn.lastCall.args[0], 16);
        assert.equal(fn.callCount, 2);
      });

      it("connects one-off inputs properly", () => {
        const n = randomInt(99);
        const node = composeExecutableNode({
          id: "test",
          instances: [
            internalNodeInstance("v1", Value(n)),
            internalNodeInstance("a", add1),
          ],
          connections: [
            {
              from: connectionNode("v1", "r"),
              to: connectionNode("a", "n"),
            },
            connectionData("a.r", "r"),
          ],
          outputs: {
            r: nodeOutput(),
          },
          inputs: {},
        });

        const r = new Subject();
        const s = spy();
        r.subscribe(s);
        execute({
          node: node,
          inputs: {},
          outputs: { r },
        });

        assert.equal(s.lastCall.args[0], n + 1);
      });

      it("connects the same output to 2 inputs", () => {
        const n = randomInt(99);
        const node = composeExecutableNode({
          id: "test",
          instances: [
            internalNodeInstance("v", Value(n)),
            internalNodeInstance("a", add),
          ],
          connections: [
            {
              from: connectionNode("v", "r"),
              to: connectionNode("a", "n1"),
            },
            {
              from: connectionNode("v", "r"),
              to: connectionNode("a", "n2"),
            },
            connectionData("a.r", "r"),
          ],
          outputs: {
            r: nodeOutput(),
          },
          inputs: {},
        });

        const r = new Subject();
        const s = spy();
        r.subscribe(s);
        execute({
          node: node,
          inputs: {},
          outputs: { r },
        });

        r.subscribe(s);

        assert.equal(s.lastCall.args[0], n * 2);
      });

      it("works regardless of the order of the instances and connections with 2 pieces", () => {
        const n = randomInt(99);
        const instances = [
          internalNodeInstance("a", add1),
          internalNodeInstance("v", Value(n)),
        ];

        for (let i = 0; i < 10; i++) {
          const node = composeExecutableNode({
            id: "test",
            instances: shuffle(instances),
            connections: [
              {
                from: connectionNode("v", "r"),
                to: connectionNode("a", "n"),
              },
              connectionData("a.r", "r"),
            ],
            inputs: {},
            outputs: {
              r: nodeOutput(),
            },
          });

          const r = new Subject();
          const s = spy();
          r.subscribe(s);
          execute({
            node: node,
            inputs: {},
            outputs: { r },
          });

          assert.equal(s.lastCall.args[0], n + 1);
        }
      });

      it("works regardless of the order of the instances and connections with 3 pieces", () => {
        const n = randomInt(99);

        const instances: InternalNodeInstance[] = [
          internalNodeInstance("a", add),
          internalNodeInstance("v1", Value(n)),
          internalNodeInstance("v2", Value(n)),
        ];

        for (let i = 0; i < 10; i++) {
          const node = composeExecutableNode({
            id: "test",
            instances: shuffle(instances),
            connections: [
              {
                from: connectionNode("v1", "r"),
                to: connectionNode("a", "n1"),
              },
              {
                from: connectionNode("v2", "r"),
                to: connectionNode("a", "n2"),
              },
              connectionData("a.r", "r"),
            ],
            inputs: {},
            outputs: {
              r: nodeOutput(),
            },
          });

          const r = new Subject();
          const s = spy();
          r.subscribe(s);
          execute({
            node: node,
            inputs: {},
            outputs: { r },
          });

          assert.equal(s.lastCall.args[0], n + n);
        }
      });

      it("connects const inputs properly", () => {
        const n = randomInt(99);
        const node: InternalVisualNode = {
          id: "test",
          inputs: {},
          outputs: {
            r: nodeOutput(),
          },
          instances: [
            internalNodeInstance("v1", Value(n)),
            internalNodeInstance("a", add1),
          ],
          connections: [
            connectionData("v1.r", "a.n"),
            connectionData("a.r", "r"),
          ],
        };

        const r = new Subject();
        const s = spy();
        r.subscribe(s);
        execute({
          node: node,
          inputs: {},
          outputs: { r },
        });

        assert.equal(s.callCount, 1);
        assert.equal(s.lastCall.args[0], n + 1);
      });
    });

    it("supports external outputs on connected nodes", () => {
      const p = composeExecutableNode({
        id: "test",
        instances: [internalNodeInstance("a", add1)],
        connections: [connectionData("n", "a.n"), connectionData("a.r", "r")],
        inputs: {
          n: nodeInput(),
        },
        outputs: {
          r: nodeOutput(),
        },
      });

      const s1 = spy();
      const s2 = spy();

      const n1 = dynamicNodeInput();
      const n2 = dynamicNodeInput();
      const r1 = new Subject();
      const r2 = new Subject();

      // normal
      execute({
        node: add1,
        inputs: { n: n1 },
        outputs: { r: r1 },
      });
      r1.subscribe(s1);
      n1.subject.next(4);
      assert.equal(s1.lastCall.args[0], 5);

      // connected
      execute({
        node: p,
        inputs: { n: n2 },
        outputs: { r: r2 },
      });
      r2.subscribe(s2);
      n2.subject.next(4);
      assert.equal(s2.lastCall.args[0], 5);
    });

    it("does not trigger fn on unexpected arguments", () => {
      const n = dynamicNodeInput();
      const bob = dynamicNodeInput();
      const r = new Subject();
      execute({
        node: add1,
        inputs: { n, bob },
        outputs: { r },
      });
      const res = spy();
      r.subscribe(res);

      n.subject.next(1);
      bob.subject.next(2);
      assert.equal(res.callCount, 1);
    });

    it("supports constant values on composeExecutableNode", () => {
      const node = composeExecutableNode({
        id: "test",
        instances: [
          internalNodeInstance("v", Value(7)),
          internalNodeInstance("a", add),
        ],
        connections: [
          connectionData("v.r", "a.n1"),
          connectionData("n2", "a.n2"),
          connectionData("a.r", "r"),
        ],
        inputs: {
          n2: nodeInput(),
        },
        outputs: {
          r: nodeOutput(),
        },
      });

      const n2 = dynamicNodeInput();
      const r = new Subject();

      const s = spy();
      assert.deepEqual(Object.keys(node.inputs), ["n2"]);
      execute({
        node: node,
        inputs: { n2 },
        outputs: { r },
      });

      r.subscribe(s);

      n2.subject.next(18);
      assert.equal(s.lastCall.args[0], 25);
    });

    it("supports static values on raw", () => {
      const node = composeExecutableNode({
        id: "test",
        instances: [
          internalNodeInstance("v", Value(7)),
          internalNodeInstance("a", transform),
        ],
        connections: [
          connectionData("v.r", "a.to"),
          connectionData("from", "a.from"),
          connectionData("a.r", "r"),
        ],
        inputs: {
          from: nodeInput(),
        },
        outputs: {
          r: nodeOutput(),
        },
      });

      const from = dynamicNodeInput();
      const r = new Subject();

      const s = spy();
      assert.deepEqual(Object.keys(node.inputs), ["from"]);

      r.subscribe(s);
      execute({
        node: node,
        inputs: { from },
        outputs: { r },
      });

      from.subject.next(18);
      assert.equal(s.lastCall.args[0], 7);
      from.subject.next(20);
      assert.equal(s.lastCall.args[0], 7);
    });

    describe("stopping execution", () => {
      it("stops running simple nodes", () => {
        const v = dynamicNodeInput();
        const r = dynamicOutput();
        const s = spy();
        const cancel = execute({
          node: id,
          inputs: { v },
          outputs: { r },
        });
        r.subscribe(s);
        v.subject.next(5);
        assert.equal(s.lastCall.args[0], 5);
        assert.equal(s.callCount, 1);
        cancel();
        v.subject.next(5);
        assert.equal(s.callCount, 1);
      });

      it("stops running connected nodes", () => {
        const internalSpy = spy();
        const s = spy();
        const ids: InternalCodeNode = fromSimplified({
          id: "test",
          inputTypes: { v: "any" },
          outputTypes: { r: "any" },
          run: (args, { r }) => {
            internalSpy();
            r?.next(args.v);
          },
        });

        const node = composeExecutableNode({
          id: "bob",
          instances: [
            internalNodeInstance("a", ids),
            internalNodeInstance("b", ids),
          ],
          connections: [
            {
              from: connectionNode("a", "r"),
              to: connectionNode("b", "v"),
            },
            connectionData("v", "a.v"),
            connectionData("a.r", "r"),
          ],
          inputs: {
            v: nodeInput(),
          },
          outputs: {
            r: nodeOutput(),
          },
        });

        const v = dynamicNodeInput();
        const r = dynamicOutput();
        const cancel = execute({
          node: node,
          inputs: { v },
          outputs: { r },
        });
        r.subscribe(s);
        v.subject.next(5);
        assert.equal(s.lastCall.args[0], 5);
        assert.equal(s.callCount, 1);
        assert.equal(internalSpy.callCount, 2);
        cancel();
        v.subject.next(5);
        assert.equal(internalSpy.callCount, 2);
        assert.equal(s.callCount, 1);
      });
    });

    describe("rx js sanity tests", () => {
      it("supports 2 subscribes on a single subject", () => {
        const sub = dynamicOutput();
        const s1 = spy();
        const s2 = spy();
        sub.subscribe(s1);
        sub.subscribe(s2);
        sub.next(42);

        assert.equal(s1.lastCall.args[0], 42);
        assert.equal(s2.lastCall.args[0], 42);
      });
    });

    it("allows same name for input and output", () => {
      const node: InternalVisualNode = {
        id: "node",
        inputs: {
          a: nodeOutput(),
        },
        outputs: {
          a: nodeOutput(),
        },
        instances: [
          internalNodeInstance("v", Value(1)),
          internalNodeInstance("add", add),
        ],
        connections: [
          connectionData("v.r", "add.n2"),
          connection(externalConnectionNode("a"), connectionNode("add", "n1")),
          connection(connectionNode("add", "r"), externalConnectionNode("a")),
        ],
      };

      const inputA = dynamicNodeInput();
      const outputA = dynamicOutput();
      const fn = spy();
      outputA.subscribe(fn);
      execute({
        node: node,
        inputs: { a: inputA },
        outputs: { a: outputA },
      });
      inputA.subject.next(2);
      assert.equal(fn.callCount, 1);
      assert.equal(fn.calledWith(3), true);
    });

    describe("more than 1 connection per pin", () => {
      it("is possible when connecting main input to 2 inputs inside it", () => {
        const node: InternalVisualNode = {
          id: "node",
          inputs: {
            n: nodeInput(),
          },
          outputs: {
            r: nodeOutput(),
          },
          instances: [internalNodeInstance("a", add)],
          connections: [
            connection(externalConnectionNode("n"), connectionNode("a", "n1")),
            connection(externalConnectionNode("n"), connectionNode("a", "n2")),
            connection(connectionNode("a", "r"), externalConnectionNode("r")),
          ],
        };

        const n = dynamicNodeInput();
        const r = dynamicOutput();
        execute({
          node: node,
          inputs: { n },
          outputs: { r },
        });

        const fn = spy();
        r.subscribe(fn);

        n.subject.next(1);
        assert.equal(fn.lastCall.args[0], 2);
      });

      it("returns all given pulses to output", async () => {
        const node: InternalVisualNode = {
          id: "node",
          inputs: {},
          outputs: {
            r: nodeOutput(),
          },
          instances: [
            internalNodeInstance("a", Value(1)),
            internalNodeInstance("b", Value(2)),
          ],
          connections: [
            connection(connectionNode("a", "r"), externalConnectionNode("r")),
            connection(connectionNode("b", "r"), externalConnectionNode("r")),
          ],
        };

        const r = dynamicOutput();
        const fn = spy();
        r.subscribe(fn);
        execute({
          node: node,
          inputs: {},
          outputs: { r },
        });

        await delay(200);

        assert.equal(fn.calledWith(1), true);
        assert.equal(fn.calledWith(2), true);
        assert.equal(fn.callCount, 2);
      });
    });


    describe("high order nodes", () => {
      it("works when node is passed directly", () => {
        const s = spy();
        const list = dynamicNodeInput();
        const fn = dynamicNodeInput();
        const r = new Subject();
        r.subscribe(s);
        execute({
          node: filter,
          inputs: { list, fn },
          outputs: { r },
        });
        list.subject.next([1, 2, 3, 4, 5, 6]);
        fn.subject.next(isEven);

        assert.equal(s.called, true);
        assert.deepEqual(s.lastCall.args[0], [2, 4, 6]);
      });
    });

    describe("node state", () => {
      const node: InternalCodeNode = {
        id: "fixture",
        inputs: { v: nodeInput() },
        outputs: { r: nodeOutput() },
        reactiveInputs: ["v"],
        completionOutputs: [],
        run: (args, outs, { state }) => {
          const n = args.v + (state.get("curr") || 0);
          outs.r?.next(n);
          state.set("curr", n);
        },
      };

      describe("global state", () => {
        it("allows nodes to access global state", () => {
          const s = spy();
          const v = dynamicNodeInput();
          const r = new Subject();

          const node1: InternalCodeNode = {
            id: "p1",
            inputs: {},
            outputs: { r: nodeOutput() },
            reactiveInputs: ["v"],
            run: (_, outs, { globalState }) => {
              const n = (globalState.get("curr") || 0) + 1;
              globalState.set("curr", n);
              outs.r?.next(n);
            },
          };
          const node2: InternalCodeNode = {
            id: "p2",
            inputs: {},
            outputs: { r: nodeOutput() },
            reactiveInputs: ["v"],
            run: (_, outs, { globalState }) => {
              const n = (globalState.get("curr") || 0) + 1;
              globalState.set("curr", n);
              outs.r?.next(n);
            },
          };

          const wrappedP2 = conciseNode({
            id: "wrappedP2",
            inputs: [],
            outputs: ["r"],
            instances: [internalNodeInstance("p2", node2)],
            connections: [
              ["__trigger", "p2.__trigger"],
              ["p2.r", "r"],
            ],
          });

          const wrapper = conciseNode({
            id: "wrapper",
            inputs: ["v"],
            outputs: ["r"],
            instances: [
              internalNodeInstance("p1", node1),
              internalNodeInstance("p2", wrappedP2),
            ],
            connections: [
              ["v", "p1.__trigger"],
              ["p1.r", "p2.__trigger"],
              ["p2.r", "r"],
            ],
          });

          r.subscribe(s);
          execute({
            node: wrapper,
            inputs: { v },
            outputs: { r },
            onBubbleError: (e) => {
              console.log("error", e);
            },
          });
          v.subject.next("");
          assert.deepEqual(s.lastCall.args[0], 2);
          v.subject.next("");
          assert.deepEqual(s.lastCall.args[0], 4);
          v.subject.next("");
          assert.deepEqual(s.lastCall.args[0], 6);
        });
      });

      it("allows nodes to access execution state", () => {
        const s = spy();
        const v = dynamicNodeInput();
        const r = new Subject();
        r.subscribe(s);
        execute({
          node: node,
          inputs: { v },
          outputs: { r },
        });
        v.subject.next(1);
        v.subject.next(2);
        v.subject.next(3);
        v.subject.next(4);
        v.subject.next(5);
        assert.equal(s.called, true);
        assert.deepEqual(s.lastCall.args[0], 1 + 2 + 3 + 4 + 5);
      });

      it("uses a different state between executions", () => {
        const s = spy();
        const v1 = dynamicNodeInput();
        const r1 = new Subject();
        const v2 = dynamicNodeInput();
        const r2 = new Subject();
        r1.subscribe(s);
        3;
        execute({
          node: node,
          inputs: { v: v1 },
          outputs: { r: r1 },
        });
        v1.subject.next(1);
        v1.subject.next(2);
        execute({
          node: node,
          inputs: { v: v2 },
          outputs: { r: r2 },
        });
        v2.subject.next(1);
        v2.subject.next(2);

        assert.deepEqual(s.lastCall.args[0], 1 + 2); // if state was shared it would be 6
      });

      it("cleans inner inputs state after node is executed - no completion", async () => {
        // this test introduces a double connection to an add node, and tests that the inner state of the inputs isn't kept
        const s = spy();
        const node = conciseNode({
          id: "test",
          inputs: ["n1", "n2"],
          outputs: ["r"],
          instances: [
            internalNodeInstance("i1", add),
            internalNodeInstance("i2", id), // id to simulate another node
          ],
          connections: [
            ["n1", "i1.n1"],
            ["n2", "i1.n2"],
            ["n1", "i2.v"],
            ["i2.r", "i1.n1"],
            ["i1.r", "r"],
          ],
        });

        const [n1, n2] = [dynamicNodeInput(), dynamicNodeInput()];
        const r = dynamicOutput();

        r.subscribe(s);
        execute({
          node: node,
          inputs: { n1, n2 },
          outputs: { r },
        });

        n1.subject.next(1);
        n2.subject.next(2);
        n1.subject.next(3);
        n2.subject.next(4);

        assert.equal(s.callCount, 2);
        assert.equal(s.getCalls()[0]?.args[0], 3);
        assert.equal(s.getCalls()[1]?.args[0], 7);
      });

      it("cleans inner inputs state after node is executed - with completion", () => {
        const s = spy();
        const node = conciseNode({
          id: "test",
          inputs: ["n1", "n2"],
          outputs: ["r"],
          instances: [
            internalNodeInstance("i1", add),
            internalNodeInstance("i2", id), // id to simulate another node
          ],
          connections: [
            ["n1", "i1.n1"],
            ["n2", "i1.n2"],
            ["n1", "i2.v"],
            ["i2.r", "i1.n1"],
            ["i1.r", "r"],
          ],
          completionOutputs: ["r"],
        });

        const [n1, n2] = [dynamicNodeInput(), dynamicNodeInput()];
        const r = dynamicOutput();

        r.subscribe(s);
        execute({
          node: node,
          inputs: { n1, n2 },
          outputs: { r },
        });

        n1.subject.next(1);
        n2.subject.next(2);
        n1.subject.next(3);
        n2.subject.next(4);

        assert.equal(s.callCount, 2);
        assert.equal(s.getCalls()[0]?.args[0], 3);
        assert.equal(s.getCalls()[1]?.args[0], 7);
      });

      it("cleans internal state of nodes after execution", async () => {
        /*
          internal node P will increase on each input received and return the current state
        */
        const counter = conciseCodeNode({
          id: "counter",
          inputs: ["v"],
          outputs: ["r"],
          reactiveInputs: ["v"],
          completionOutputs: [],
          run: (_, { r }, { state }) => {
            const c = state.get("c") || 0;
            state.set("c", c + 1);
            r?.next(c);
          },
        });

        const counterWrapper = conciseNode({
          id: "cwrap",
          inputs: ["v"],
          outputs: ["r"],
          completionOutputs: ["r"],
          instances: [internalNodeInstance("i1", counter)],
          connections: [
            ["v", "i1.v"],
            ["i1.r", "r"],
          ],
        });

        const v = dynamicNodeInput();
        const r = dynamicOutput();
        const s = spy();
        r.subscribe(s);

        execute({
          node: counterWrapper,
          inputs: { v },
          outputs: { r },
        });
        v.subject.next(1);
        v.subject.next(1);
        v.subject.next(1);

        assert.equal(s.callCount, 3);
        assert.equal(s.getCalls()[0]?.args[0], 0);
        assert.equal(s.getCalls()[1]?.args[0], 0);
        assert.equal(s.getCalls()[2]?.args[0], 0);
      });

      it("does not clean internal of nodes after execution until parent is not done", () => {
        /*
          internal node P will increase on each input received and return the current state
        */
        const counter = conciseCodeNode({
          id: "counter",
          inputs: ["v"],
          outputs: ["r"],
          reactiveInputs: ["v"],
          completionOutputs: [],
          run: (_, { r }, { state }) => {
            const c = state.get("c") || 0;
            state.set("c", c + 1);
            r?.next(c);
          },
        });

        const counterWrapper = conciseNode({
          id: "cwrap",
          inputs: ["v", "v2|optional"],
          completionOutputs: ["r2"],
          outputs: ["r", "r2"],
          reactiveInputs: ["v", "v2"],
          instances: [
            internalNodeInstance("i1", counter),
            internalNodeInstance("i2", id),
          ],
          connections: [
            ["v", "i1.v"],
            ["i1.r", "r"],
            ["v2", "i2.v"],
            ["i2.r", "r2"],
          ],
        });

        const [v, v2] = [dynamicNodeInput(), dynamicNodeInput()];
        const [r, r2] = [dynamicOutput(), dynamicOutput()];
        const s = spy();
        r.subscribe(s);

        execute({
          node: counterWrapper,
          inputs: { v, v2 },
          outputs: { r, r2 },
        });
        v.subject.next(1);
        v.subject.next(1);

        assert.equal(s.callCount, 2);
        assert.equal(s.getCalls()[0]?.args[0], 0);
        assert.equal(s.getCalls()[1]?.args[0], 1);

        v2.subject.next("bob");
        v.subject.next("bob");
        assert.equal(s.callCount, 4);
        assert.equal(s.getCalls()[3]?.args[0], 0);
      });

      it("uses shared global state to allow for hot reloading, and more", async () => {
        const s = spy();
        const v = dynamicNodeInput();
        const r = new Subject();
        r.subscribe(s);
        const state = {};
        execute({
          node: node,
          inputs: { v },
          outputs: { r },
          mainState: state,
        });
        v.subject.next(1);
        v.subject.next(2);
        v.subject.next(3);
        v.subject.next(4);
        v.subject.next(5);
        assert.equal(s.called, true);
        assert.deepEqual(s.lastCall.args[0], 1 + 2 + 3 + 4 + 5);
      });
    });

    it("runs nodes that are not fully connected", () => {
      const node: InternalVisualNode = {
        id: "node",
        inputs: {
          n: nodeInput(),
        },
        outputs: {
          r: nodeOutput(),
        },
        instances: [
          internalNodeInstance("p1", id),
          internalNodeInstance("p2", add),
        ],
        connections: [connectionData("n", "p1.v"), connectionData("p1.r", "r")],
      };

      const n = dynamicNodeInput();
      const r = new Subject();
      const s = spy();

      r.subscribe(s);

      execute({
        node: node,
        inputs: { n },
        outputs: { r },
      });
      n.subject.next(42);

      assert.equal(s.calledWith(42), true);
    });
  });

  describe("uncontrolled visual nodes", () => {
    it("waits for all inputs when visual node is uncontrolled", () => {
      const innerSpy = spy();
      const innerNode: InternalCodeNode = {
        id: "inner",
        inputs: {},
        outputs: {},
        run: () => {
          innerSpy();
        },
      };

      const visual: InternalVisualNode = {
        id: "bob",
        inputs: { n: nodeInput() },
        outputs: {},
        instances: [internalNodeInstance("i", innerNode)],
        connections: [],
      };

      const n = dynamicNodeInput();
      const r = new Subject();

      const s = spy();
      r.subscribe(s);

      execute({
        node: visual,
        inputs: { n },
        outputs: {},
      });

      assert.equal(innerSpy.callCount, 0);

      n.subject.next(1);

      assert.equal(innerSpy.callCount, 1);
    });
  });

  describe("recursion support", () => {
    it("does run nodes that have no args", () => {
      const node: InternalCodeNode = {
        id: "node",
        inputs: {},
        outputs: {
          r: nodeOutput(),
        },
        run: (_, { r }) => {
          r?.next("ok");
        },
      };

      const r = new Subject();
      const s = spy();

      r.subscribe(s);

      execute({
        node: node,
        inputs: {},
        outputs: { r },
      });
      assert.equal(s.lastCall.args[0], "ok");
    });

    it('support recursive "add" calculation', () => {
      const addRec: InternalVisualNode = {
        id: "add-rec",
        inputs: {
          n: nodeInput(),
        },
        outputs: {
          r: nodeOutput(),
        },
        instances: [
          internalNodeInstance("zero", zero),
          internalNodeInstance("one", one),
          internalNodeInstance("mOne", mOne),
          internalNodeInstance("if", peq),
          internalNodeInstance("add1", add),
          internalNodeInstance("add2", add),
          internalNodeInstance("tr1", transform),
        ],
        connections: [
          connectionData("n", "if.val"),
          connectionData("add1.r", "arr.n"),
          connectionData("if.r", "tr1.from"),
          connectionData("tr1.r", "r"),
          connectionData("if.else", "add1.n1"),
          connectionData("arr.r", "add2.n1"),
          connectionData("add2.r", "r"),
          connectionData("zero.r", "if.compare"),
          connectionData("one.r", "tr1.to"),
          connectionData("mOne.r", "add1.n2"),
          connectionData("one.r", "add2.n2"),
        ],
      };

      addRec.instances.push(internalNodeInstance("arr", addRec));

      const r = new Subject();
      const s = spy();

      const n = dynamicNodeInput();

      r.subscribe(s);

      execute({
        node: addRec,
        inputs: { n },
        outputs: { r },
        onBubbleError: (e) => {
          console.log(e);
        },
      });

      n.subject.next(1);
      assert.equal(s.called, true);
      assert.equal(s.lastCall.args[0], 2);

      const num = randomInt(15, 25);
      n.subject.next(num);
      assert.equal(s.lastCall.args[0], num + 1);

      n.subject.next(0);
      assert.equal(s.lastCall.args[0], 1);

      n.subject.next(1);
    });

    it("support recursion based factorial calculation", async () => {
      const value1 = valueNode("z", 0);
      const value2 = valueNode("one", 1);
      const value3 = valueNode("m1", -1);

      const fact: InternalVisualNode = {
        id: "fact",
        inputs: {
          n: nodeInput(),
        },
        outputs: {
          r: nodeOutput(),
        },
        instances: [
          internalNodeInstance("z", value1),
          internalNodeInstance("one", value2),
          internalNodeInstance("m1", value3),
          internalNodeInstance("if", peq),
          internalNodeInstance("add", add),
          internalNodeInstance("mul", mul),
          internalNodeInstance("tr1", transform),
        ],
        connections: [
          connectionData("n", "if.val"),
          connectionData("z.r", "if.compare"),
          connectionData("if.r", "tr1.from"),
          connectionData("one.r", "tr1.to"),
          connectionData("tr1.r", "r"),
          connectionData("if.else", "add.n1"),
          connectionData("if.else", "mul.n2"),
          connectionData("m1.r", "add.n2"),
          connectionData("add.r", "f.n"),
          connectionData("f.r", "mul.n1"),
          connectionData("mul.r", "r"),
        ],
      };

      fact.instances.push(internalNodeInstance("f", fact));

      const r = new Subject();
      const s = spy();

      const n = dynamicNodeInput();

      r.subscribe(s);

      execute({
        node: fact,
        inputs: { n },
        outputs: { r },
      });

      n.subject.next(0);

      assert.equal(s.lastCall.args[0], 1);

      n.subject.next(1);
      assert.equal(s.lastCall.args[0], 1);

      n.subject.next(2);
      assert.equal(s.lastCall.args[0], 2);

      n.subject.next(4);
      assert.equal(s.lastCall.args[0], 24);

      n.subject.next(3);
      assert.equal(s.lastCall.args[0], 6);

      n.subject.next(10);
      assert.equal(s.lastCall.args[0], 3628800);

      assert.equal(s.callCount, 6);
    });
  });

  describe("node cleanup", () => {
    it("runs cleanup code after a a node finished running on internalcode node", () => {
      const spyFn = spy();
      const node: InternalCodeNode = {
        id: "id",
        inputs: {
          v: nodeInput(),
        },
        outputs: {
          r: nodeInput(),
        },
        run: ({ v }, { r }, { onCleanup: cleanup }) => {
          r?.next(v);
          cleanup(() => {
            spyFn();
          });
        },
      };
      const v = dynamicNodeInput();
      const r = dynamicOutput();
      const clean = execute({
        node: node,
        inputs: { v },
        outputs: { r },
      });
      v.subject.next(2);
      assert.equal(spyFn.calledOnce, false);
      clean();
      assert.equal(spyFn.calledOnce, true);
    });

    it("calls destroy fn of debugger when cleaning up", () => {
      const spyFn = spy();
      const node: InternalCodeNode = {
        id: "id",
        inputs: {
          v: nodeInput(),
        },
        outputs: {
          r: nodeInput(),
        },
        run: ({ v }, { r }, { onCleanup: cleanup }) => {
          r?.next(v);
          cleanup(() => {
            spyFn();
          });
        },
      };
      const v = dynamicNodeInput();
      const r = dynamicOutput();
      const clean = execute({
        node: node,
        inputs: { v },
        outputs: { r },
      });
      v.subject.next(2);
      assert.equal(spyFn.calledOnce, false);
      clean();
      assert.equal(spyFn.calledOnce, true);
    });
  });

  describe("extra context", () => {
    it("passes external context forward when running code comps", async () => {
      const bobber = (n: number) => n + 42;
      const node: InternalCodeNode = {
        id: "tester",
        inputs: {},
        outputs: {
          r: nodeInput(),
        },
        run: (_, o, adv) => {
          o.r?.next(adv.context.bobber(12));
        },
      };
      const r = dynamicOutput();
      const s = spy();
      r.subscribe(s);
      execute({
        node: node,
        inputs: {},
        outputs: { r },
        extraContext: { bobber },
      });
      assert.equal(s.callCount, 1);
      assert.equal(s.lastCall.args[0], 54);
    });

    it.skip("passes external context forward to visual nodes", async () => {
      // TODO - write test
    });
  });

  describe("node v2 tests", () => {
    it("queues values - internal code node", () => {
      const [n1, n2] = [
        dynamicNodeInput({
          // config: queueInputPinConfig(),
        }),
        dynamicNodeInput({
          // config: queueInputPinConfig(),Rr3
        }),
      ];

      const r = new Subject();
      const s = spy();
      r.subscribe(s);

      execute({
        node: add,
        inputs: { n1, n2 },
        outputs: { r },
      });

      n1.subject.next(1);
      n1.subject.next(2);
      n1.subject.next(3);

      n2.subject.next(4);

      n2.subject.next(5);
      n2.subject.next(6);
      assert.deepEqual(callsFirstArgs(s), [5, 7, 9]);
    });

    it("queues values - visual node", () => {
      const [n1, n2] = [
        dynamicNodeInput({
          // config: queueInputPinConfig(),
        }),
        dynamicNodeInput({
          // config: queueInputPinConfig(),
        }),
      ];

      const r = new Subject();
      const s = spy();
      r.subscribe(s);

      execute({
        node: addGroupedQueued,
        inputs: { n1, n2 },
        outputs: { r },
      });

      n1.subject.next(1);
      n1.subject.next(2);
      n1.subject.next(3);

      n2.subject.next(4);

      n2.subject.next(5);
      n2.subject.next(6);
      assert.deepEqual(callsFirstArgs(s), [5, 7, 9]);
    });

    it("sticky values work on simple code", () => {
      const a = dynamicNodeInput({ config: queueInputPinConfig() });
      const b = dynamicNodeInput({ config: stickyInputPinConfig() });

      const r = dynamicOutput();

      const s = spy();

      r.subscribe(s);

      const node = conciseCodeNode({
        inputs: ["a", "b"],
        outputs: ["r"],
        id: "bob",
        run: ({ a, b }, { r }) => {
          r?.next([a, b]);
        },
        completionOutputs: ["r"],
      });

      execute({
        node: node,
        inputs: { a, b },
        outputs: { r },
      });

      a.subject.next(1);
      a.subject.next(2);
      a.subject.next(3);
      b.subject.next(4);

      assert.equal(s.callCount, 3);
      assert.deepEqual(callsFirstArgs(s), [
        [1, 4],
        [2, 4],
        [3, 4],
      ]);
    });

    it("completes last value only when node is done", async () => {
      const item = dynamicNodeInput({ config: queueInputPinConfig() });

      const r = new Subject();
      const s = spy();
      r.subscribe(s);

      const delayer: InternalCodeNode = {
        id: "delayer",
        inputs: {
          item: nodeInput(),
        },
        outputs: {
          r: nodeOutput(),
        },
        completionOutputs: ["r"],
        run: ({ item }, { r }) => {
          setTimeout(() => {
            r?.next(item);
          }, item as any);
        },
      };

      execute({
        node: delayer,
        inputs: { item },
        outputs: { r },
      });

      item.subject.next(10);
      item.subject.next(5);
      item.subject.next(1);

      await eventually(
        () => {
          assert.deepEqual(callsFirstArgs(s), [10, 5, 1]);
        },
        100,
        5
      );
    });

    describe("node completion", () => {
      it("re-runs nodes when one of the required outputs complete", async () => {
        const item = dynamicNodeInput({ config: queueInputPinConfig() });

        const r = new Subject();
        const final = new Subject();
        const s = spy();
        r.subscribe(s);
        final.subscribe(s);

        const delayer: InternalCodeNode = {
          id: "delayer",
          inputs: {
            item: nodeInput(),
          },
          outputs: {
            r: nodeOutput(),
            final: nodeOutput(),
          },
          completionOutputs: ["final"],
          run: ({ item }, { r, final }) => {
            r?.next(item);

            setTimeout(() => {
              final?.next(item);
            }, 10);
          },
        };

        execute({
          node: delayer,
          inputs: { item },
          outputs: { r, final },
        });

        item.subject.next(1);
        item.subject.next(2);
        item.subject.next(3);

        await eventually(
          () => {
            assert.deepEqual(callsFirstArgs(s), [1, 1, 2, 2, 3, 3]);
          },
          200,
          5
        );
      });

      it("supports + as the AND operator for completion outputs", async () => {
        const item = dynamicNodeInput({ config: queueInputPinConfig() });

        const f1 = dynamicOutput();
        const f2 = dynamicOutput();

        const s = spy();
        f1.subscribe(s);
        f2.subscribe(s);

        const [_, r] = spiedOutput();

        const delayer: InternalCodeNode = {
          id: "delayer",
          inputs: {
            item: nodeInput(),
          },
          outputs: {
            r: nodeOutput(),
            f1: nodeOutput(),
            f2: nodeOutput(),
          },
          completionOutputs: ["f1+f2"],
          run: ({ item }, { r, f1, f2 }) => {
            r?.next(item);

            setTimeout(() => {
              f1?.next(item);
            }, 5);

            setTimeout(() => {
              f2?.next(item);
            }, 10);
          },
        };

        execute({
          node: delayer,
          inputs: { item },
          outputs: { f1, f2, r },
        });

        item.subject.next(1);
        item.subject.next(2);
        item.subject.next(3);

        await eventually(
          () => {
            assert.deepEqual(callsFirstArgs(s), [1, 1, 2, 2, 3, 3]);
          },
          200,
          5
        );
      });

      it("re-runs nodes only when one of the required outputs complete if there are more than 1", async () => {
        const item = dynamicNodeInput({ config: queueInputPinConfig() });

        const [r, final1, final2] = [
          dynamicOutput(),
          dynamicOutput(),
          dynamicOutput(),
        ];

        const s = spy();
        final1.subscribe((v) => s(`f1-${v}`));
        final2.subscribe((v) => s(`f2-${v}`));
        r.subscribe((v) => s(`r-${v}`));

        const delayer: InternalCodeNode = {
          id: "delayer",
          inputs: {
            item: nodeInput(),
          },
          outputs: {
            r: nodeOutput(),
            final1: nodeOutput(),
            final2: nodeOutput(),
          },
          completionOutputs: ["final1", "final2"],
          run: ({ item }, { r, final1, final2 }) => {
            r?.next(item);

            setTimeout(() => {
              if (item) {
                final1?.next(item);
              } else {
                final2?.next(item);
              }
            }, 10);
          },
        };

        execute({
          node: delayer,
          inputs: { item },
          outputs: { r, final1, final2 },
        });

        item.subject.next(0);
        item.subject.next(1);
        item.subject.next(0);

        await eventually(
          () => {
            assert.deepEqual(callsFirstArgs(s), [
              "r-0",
              "f2-0",
              "r-1",
              "f1-1",
              "r-0",
              "f2-0",
            ]);
          },
          200,
          5
        );
      });

      it("completes nodes when there are errors", async () => {
        const item = dynamicNodeInput({ config: queueInputPinConfig() });

        const [r, final1] = [dynamicOutput(), dynamicOutput(), dynamicOutput()];

        const s = spy();
        final1.subscribe((v) => s(`f1-${v}`));
        r.subscribe((v) => s(`r-${v}`));

        const delayer: InternalCodeNode = {
          id: "delayer",
          inputs: {
            item: nodeInput(),
          },
          outputs: {
            r: nodeOutput(),
            final1: nodeOutput(),
            final2: nodeOutput(),
          },
          completionOutputs: ["final1", "final2"],
          run: ({ item }, { r, final1 }) => {
            r?.next(item);

            if (!item) {
              throw new Error(`${item}`);
            }
            setTimeout(() => {
              if (item) {
                final1?.next(item);
              }
            }, 10);
          },
        };

        const onError = (err: NodeInstanceError) => {
          const val = err.message?.match(/(\d)/)?.[1];
          s(`e-${val}`);
        };

        execute({
          node: delayer,
          inputs: { item },
          outputs: { r, final1 },
          onBubbleError: onError,
        });

        item.subject.next(0);
        item.subject.next(1);
        item.subject.next(0);

        await eventually(
          () => {
            assert.deepEqual(callsFirstArgs(s), [
              "r-0",
              "e-0",
              "r-1",
              "f1-1",
              "r-0",
              "e-0",
            ]);
          },
          200,
          5
        );
      });

      it("triggers the completion callback with last values when completed", async () => {
        const simpleCompletion: InternalCodeNode = {
          id: "simpleCompletion",
          inputs: {},
          outputs: {
            r: nodeOutput(),
          },
          completionOutputs: ["r"],
          run: ({}, { r }) => {
            setTimeout(() => {
              r?.next("bob");
            }, 10);
          },
        };
        const r = dynamicOutput();

        const completionSpy = spy();

        execute({
          node: simpleCompletion,
          inputs: {},
          outputs: { r },
          onCompleted: completionSpy,
        });

        assert.equal(completionSpy.called, false);
        await eventually(
          () => {
            assert.equal(completionSpy.called, true);
          },
          100,
          10
        );
        assert.equal(completionSpy.callCount, 1);
        assert.deepEqual(completionSpy.lastCall.args[0], { r: "bob" });
      });

      describe("implicit completion", () => {
        describe("internal code nodes", () => {
          it("triggers an implicit completion when there are no explicit completion outputs", async () => {
            const node = conciseCodeNode({
              outputs: ["r"],
              run: (_, o) => o.r?.next("ok"),
            });
            const s = spy();
            execute({
              node,

              inputs: {},
              outputs: { r: dynamicOutput() },
              onCompleted: s,
            });
            assert.equal(s.callCount, 1);
            assert.deepEqual(s.lastCall.args[0], { r: "ok" });
          });

          it("waits for promises to resolve before triggering an implicit completion of internal code node with no explicit completion outputs", async () => {
            const node = conciseCodeNode({
              outputs: ["r"],
              run: async (_, o) => {
                await new Promise((r) => setTimeout(r, 10));
                o.r?.next("ok");
              },
            });

            const s = spy();
            const [sr, r] = spiedOutput();
            execute({
              node,

              inputs: {},
              outputs: { r },
              onCompleted: s,
            });
            await eventually(() => {
              assert.isTrue(sr.calledWith("ok"));
            });
            assert.isTrue(s.calledAfter(sr));
          });

          it("keeps state of a an implicitly running node", async () => {
            const node = conciseCodeNode({
              inputs: ["a"],
              outputs: ["r"],
              reactiveInputs: ["a"],
              run: async (_, o, adv) => {
                const s = adv.state.get("s") ?? 0;
                adv.state.set("s", s + 1);
                await new Promise((r) => setTimeout(r, 10));
                o.r?.next(s);
              },
            });

            const s = spy();
            const [sr, r] = spiedOutput();
            const input = dynamicNodeInput();
            execute({
              node,

              inputs: { a: input },
              outputs: { r },
              onCompleted: s,
            });
            input.subject.next();
            input.subject.next();
            input.subject.next();
            await eventually(() => {
              assert.equal(sr.callCount, 3);
              assert.deepEqual(
                sr.getCalls().map((c) => c.args[0]),
                [0, 1, 2]
              );
            });
            assert.isTrue(s.calledAfter(sr));
          });
        });

        describe("visual nodes", () => {
          it('triggers implicit completion when nodes "inside" stop running', async () => {
            const delayNode = (ms: number) =>
              conciseCodeNode({
                outputs: ["r"],
                run: async (_, o) => {
                  await new Promise((r) => setTimeout(r, ms));
                  o.r?.next("ok");
                },
                id: `delay-${ms}`,
              });

            const delay10 = delayNode(10);
            const delay5 = delayNode(5);

            const wrapper = conciseNode({
              outputs: ["r"],
              instances: [
                {
                  id: "a",
                  node: delay5,
                  inputConfig: {},
                },
                {
                  id: "b",
                  node: delay10,
                  inputConfig: {},
                },
              ],
              connections: [
                ["a.r", "b." + TRIGGER_PIN_ID],
                ["b.r", "r"],
              ],
            });

            const [sr, r] = spiedOutput();
            const onCompleted = spy();
            execute({
              node: wrapper,
              inputs: {},
              outputs: { r },
              onCompleted,
            });
            await eventually(() => {
              assert.isTrue(sr.calledWith("ok"));
            });
            assert.equal(sr.callCount, 1);
            assert.isTrue(onCompleted.called);
            assert.isTrue(onCompleted.calledAfter(sr));
          });
        });
      });
    });

    it("cleans up node only when the node is done", async () => {
      const item = dynamicNodeInput({ config: queueInputPinConfig() });

      const r = new Subject();
      const final = new Subject();
      const cleanSpy = spy();
      const s = spy();
      r.subscribe(s);
      final.subscribe(s);

      const someNode: InternalCodeNode = {
        id: "someNode",
        inputs: {
          item: nodeInput(),
        },
        outputs: {
          r: nodeOutput(),
          final: nodeOutput(),
        },
        reactiveInputs: ["item"],
        completionOutputs: ["final"],
        run: ({ item }, { r, final }, { state }) => {
          const s = state.get("val") + 1 || 1;
          state.set("val", s);

          if ((item as any) === 42) {
            final?.next(s);
          } else {
            r?.next(s);
          }

          return () => {
            cleanSpy();
          };
        },
      };

      const clean = execute({
        node: someNode,
        inputs: { item },
        outputs: { r, final },
      });

      item.subject.next(23423); // call 0
      item.subject.next(124); // call 1
      item.subject.next(122); // call 2
      item.subject.next(42); // call 3
      item.subject.next(123); // call 4

      clean();
      assert.equal(cleanSpy.callCount, 2); // once becauae of 42 and the second because of "clean"
    });

    describe("accumulate", () => {
      const accumulate: InternalCodeNode = {
        id: "acc",
        inputs: {
          item: nodeInput(),
          count: nodeInput(),
        },
        outputs: {
          r: nodeOutput(),
        },
        reactiveInputs: ["item"],
        completionOutputs: ["r"],
        run: ({ item, count }, { r }, { state }) => {
          let list = state.get("list") || [];

          if (count !== state.get("count")) {
            list = [];
            state.set("count", count);
          }

          list.push(item);

          state.set("list", list);

          if (list.length === state.get("count")) {
            r?.next(list);
          }
        },
      };

      it("supports creation of an accumulate", () => {
        const count = dynamicNodeInput({ config: queueInputPinConfig() });
        const item = dynamicNodeInput({ config: queueInputPinConfig() });

        const r = new Subject();
        const s = spy();
        r.subscribe(s);

        execute({
          node: accumulate,
          inputs: { item, count },
          outputs: { r },
        });

        count.subject.next(1);
        item.subject.next(23423); // call 0
        count.subject.next(2);
        item.subject.next(12); // call 0
        item.subject.next(23); // call 0
        assert.deepEqual(s.getCalls()[0]?.args[0], [23423]);
        assert.deepEqual(s.getCalls()[1]?.args[0], [12, 23]);
      });

      it("supports creation of an accumulate, another variation of input order", () => {
        const count = dynamicNodeInput({ config: queueInputPinConfig() });
        const item = dynamicNodeInput({ config: queueInputPinConfig() });

        const r = new Subject();
        const s = spy();
        r.subscribe(s);

        execute({
          node: accumulate,
          inputs: { item, count },
          outputs: { r },
        });

        item.subject.next(1);
        count.subject.next(1);
        item.subject.next(2);
        item.subject.next(3);
        count.subject.next(2);
        item.subject.next(4);
        item.subject.next(5);
        item.subject.next(6);
        count.subject.next(3);

        assert.deepEqual(s.getCalls()[0]?.args[0], [1]);
        assert.deepEqual(s.getCalls()[1]?.args[0], [2, 3]);
        assert.deepEqual(s.getCalls()[2]?.args[0], [4, 5, 6]);
      });

      it("supports creation of an accumulate, third variation of input order", () => {
        const count = dynamicNodeInput({ config: queueInputPinConfig() });
        const item = dynamicNodeInput({ config: queueInputPinConfig() });

        const r = new Subject();
        const s = spy();
        r.subscribe(s);

        execute({
          node: accumulate,
          inputs: { item, count },
          outputs: { r },
        });

        item.subject.next(1);
        count.subject.next(1);
        item.subject.next(2);
        count.subject.next(2);
        count.subject.next(3);
        item.subject.next(3);
        item.subject.next(4);
        item.subject.next(5);
        item.subject.next(6);

        assert.deepEqual(s.getCalls()[0]?.args[0], [1]);
        assert.deepEqual(s.getCalls()[1]?.args[0], [2, 3]);
        assert.deepEqual(s.getCalls()[2]?.args[0], [4, 5, 6]);
      });

      it("allows creating accumulate2 visually (shared state)", () => {
        const two = valueNode("two", 2);
        const visualNode = conciseNode({
          id: "bob",
          inputs: ["val"],
          outputs: ["r"],
          completionOutputs: ["r"],
          reactiveInputs: ["val"],
          instances: [
            internalNodeInstance("two", two),
            internalNodeInstance("i1", accumulate),
          ],
          connections: [
            ["two.r", "i1.count"],
            ["val", "i1.item"],
            ["i1.r", "r"],
          ],
        });

        const s = spy();
        const val = dynamicNodeInput();
        const count = dynamicNodeInput();
        const r = dynamicOutput();
        r.subscribe(s);

        execute({
          node: visualNode,
          inputs: { val, count },
          outputs: { r },
        });

        val.subject.next(1);
        val.subject.next(2);

        assert.equal(s.callCount, 1);
        assert.deepEqual(s.lastCall.args[0], [1, 2]);
      });

      it("accumulate2 visually cleans up state properly after it is done", () => {
        const visualNode = conciseNode({
          id: "bob",
          inputs: ["val", "count"],
          outputs: ["r"],
          reactiveInputs: ["val"],
          instances: [internalNodeInstance("i1", accumulate, {})],
          connections: [
            ["val", "i1.item"],
            ["count", "i1.count"],
            ["i1.r", "r"],
          ],
          completionOutputs: ["r"],
        });

        const s = spy();
        const val = dynamicNodeInput();
        const count = dynamicNodeInput();
        const r = dynamicOutput();
        r.subscribe(s);

        execute({
          node: visualNode,
          inputs: { val, count },
          outputs: { r },
        });

        count.subject.next(2);
        count.subject.next(3);
        val.subject.next(1);
        val.subject.next(2);

        val.subject.next(3);
        val.subject.next(4);
        val.subject.next(5);

        assert.equal(s.callCount, 2);
        assert.deepEqual(s.getCalls()[0]?.args[0], [1, 2]);
        assert.deepEqual(s.getCalls()[1]?.args[0], [3, 4, 5]);
      });

      it('supports creation of "accumulate until"', () => {
        const accUntil: InternalCodeNode = {
          id: "acc",
          inputs: {
            item: nodeInput("optional"),
            until: nodeInput("optional"),
          },
          outputs: {
            r: nodeOutput(),
          },
          reactiveInputs: ["item", "until"],
          completionOutputs: ["r"],
          run: ({ item, until }, { r }, { state }) => {
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

        const until = dynamicNodeInput({ config: queueInputPinConfig() });
        const item = dynamicNodeInput({ config: queueInputPinConfig() });

        const r = new Subject();
        const s = spy();
        r.subscribe(s);

        execute({
          node: accUntil,
          inputs: { item, until },
          outputs: { r },
        });

        item.subject.next(22);
        item.subject.next(23);
        until.subject.next(2);
        // until.subject.next();

        assert.deepEqual(s.getCalls()[0]?.args[0], [22, 23]);
        // assert.deepEqual(s.getCalls()[1]?.args[0], [2, 3]);
        // assert.deepEqual(s.getCalls()[2]?.args[0], [4, 5, 6]);
      });
    });

    it('supports creation of "merge" node - code', () => {
      const merge: InternalCodeNode = {
        id: "merge",
        inputs: {
          a: nodeInput("optional"),
          b: nodeInput("optional"),
        },
        outputs: {
          r: nodeOutput(),
        },
        run: ({ a, b }, { r }) => {
          if (isDefined(a)) {
            r?.next(a);
          }

          if (isDefined(b)) {
            r?.next(b);
          }
        },
      };

      const a = dynamicNodeInput({ config: queueInputPinConfig() });
      const b = dynamicNodeInput({ config: queueInputPinConfig() });

      const r = new Subject();
      const s = spy();
      r.subscribe(s);

      execute({
        node: merge,
        inputs: { a, b },
        outputs: { r },
      });

      const numbers = randomInts(20);

      const inputsToUse = repeat(20, () => pickRandom([a, b]));

      numbers.forEach((n, idx) => {
        inputsToUse[idx]?.subject.next(n);
      });

      numbers.forEach((n, idx) => {
        assert.deepEqual(s.getCalls()[idx]?.args[0], n);
      });
    });

    it('supports creation of "merge" node - visual', () => {
      const mergeGrouped: InternalVisualNode = {
        id: "visual-node",

        inputs: {
          b: nodeInput("optional"),
          a: nodeInput("optional"),
        },
        outputs: {
          r: nodeOutput(),
        },
        instances: [internalNodeInstance("id", id2)],
        connections: [
          connectionData("a", "id.v"),
          connectionData("b", "id.v"),
          connectionData("id.r", "r"),
        ],
      };

      const a = dynamicNodeInput({ config: queueInputPinConfig() });
      const b = dynamicNodeInput({ config: queueInputPinConfig() });

      const r = new Subject();
      const s = spy();
      r.subscribe(s);

      execute({
        node: mergeGrouped,
        inputs: { b, a },
        outputs: { r },
      });

      const valuesCount = randomInt(10, 20);

      const values = repeat(valuesCount, () => randomInt(100));
      const subjects = repeat(valuesCount, () => pickRandom([a, b]));

      subjects.forEach((s, idx) => {
        s.subject.next(values[idx]);
      });

      assert.equal(s.callCount, valuesCount);

      values.forEach((val, idx) => {
        assert.equal(s.getCalls()[idx]?.args[0], val);
      });
    });

    describe("input modes", () => {
      it("required - does not run a node before with required inputs if they do not existing", () => {
        const s = spy();
        const dummyNode = conciseCodeNode({
          id: "bob",
          inputs: ["a|required", "b|required"],
          outputs: ["r"],
          run: () => {
            s();
          },
        });

        const [a, b] = [dynamicNodeInput(), dynamicNodeInput()];

        execute({
          node: dummyNode,
          inputs: { a },
          outputs: {},
        });
        execute({
          node: dummyNode,
          inputs: { b },
          outputs: {},
        });

        a.subject.next(1);
        b.subject.next(2);

        assert.equal(s.callCount, 0);

        execute({
          node: dummyNode,
          inputs: { a, b },
          outputs: {},
        });

        a.subject.next(1);
        b.subject.next(2);
        assert.equal(s.callCount, 1);
      });

      it("required if connected - runs if not connected, but does not run if connected", () => {
        const s = spy();
        const dummyNode = conciseCodeNode({
          id: "bob",
          inputs: ["a|required", "b|required-if-connected"],
          outputs: ["r"],
          run: () => {
            s();
          },
        });

        const [a, b] = [dynamicNodeInput(), dynamicNodeInput()];

        execute({
          node: dummyNode,
          inputs: { a, b },
          outputs: {},
        });

        a.subject.next(1);

        assert.equal(s.callCount, 0);

        execute({
          node: dummyNode,
          inputs: { a },
          outputs: {},
        });

        a.subject.next(1);

        assert.equal(s.callCount, 1);

        b.subject.next(2);
        assert.equal(s.callCount, 2);
      });
    });
  });

  describe("error handling", () => {
    const errorReportingNode = conciseCodeNode({
      id: "bad",
      inputs: ["a"],
      outputs: ["r"],
      run: (_, __, { onError }) => {
        onError(new Error("blah"));
      },
    });

    it("reports errors that were reported inside a direct node", async () => {
      const s = spy();
      const a = dynamicNodeInput();

      const debuggerSpy = spy();
      const onEvent = wrappedOnEvent(DebuggerEventType.ERROR, debuggerSpy);

      execute({
        node: errorReportingNode,
        inputs: { a },
        outputs: {},
        onBubbleError: s,
        insId: "someIns",
        _debugger: { onEvent },
      });

      assert.equal(s.callCount, 0);

      a.subject.next("bob");

      assert.equal(s.callCount, 1);

      const lastError = (): NodeInstanceError => s.lastCall.args[0];
      assert.include(lastError().toString(), "blah");
      assert.include(lastError().fullInsIdsPath, "someIns");

      assert.equal(debuggerSpy.callCount, 1);
      assert.include(s.lastCall.args[0].message, "nodeId: bad");
    });

    it("reports errors that were thrown inside a direct node", async () => {
      const s = spy();
      const a = dynamicNodeInput();

      const p2 = {
        ...errorReportingNode,
        run: () => {
          throw new Error("blaft");
        },
      };

      const onEvent = wrappedOnEvent(DebuggerEventType.ERROR, s);

      1;
      execute({
        node: p2,
        inputs: { a },
        outputs: {},
        _debugger: { onEvent },
        insId: "someIns",
      });

      assert.equal(s.callCount, 0);

      a.subject.next("bob");

      assert.equal(s.callCount, 1);

      assert.include(s.lastCall.args[0].val.toString(), "blaft");
      assert.include(s.lastCall.args[0].insId, "someIns");
    });

    it("reports async errors that were thrown inside a direct node", async () => {
      const s = spy();
      const a = dynamicNodeInput();

      const p2 = {
        ...errorReportingNode,
        run: async () => {
          throw new Error("blaft");
        },
      };

      const onEvent = wrappedOnEvent(DebuggerEventType.ERROR, s);

      execute({
        node: p2,
        inputs: { a },
        outputs: {},
        _debugger: { onEvent },
        insId: "someIns",
      });

      assert.equal(s.callCount, 0);

      a.subject.next("bob");

      await eventually(() => {
        assert.equal(s.callCount, 1);

        assert.include(s.lastCall.args[0].val.toString(), "blaft");
        assert.include(s.lastCall.args[0].insId, "someIns");
      });
    });

    it("reports async errors that were reported inside a direct node", async () => {
      const s = spy();
      const a = dynamicNodeInput();

      const p2 = {
        ...errorReportingNode,
        run: async (_, __, { onError }) => {
          onError(new Error("blaft"));
        },
      };

      const onEvent = wrappedOnEvent(DebuggerEventType.ERROR, s);

      try {
        execute({
          node: p2,
          inputs: { a },
          outputs: {},
          _debugger: { onEvent },
          insId: "someIns",
          // onBubbleError: (e) => {
          //   // throw e;
          // },
        });

        assert.equal(s.callCount, 0);
        a.subject.next("bob");
      } catch (e) {
        console.log("bob", e);
      }

      await eventually(() => {
        assert.equal(s.callCount, 1);

        assert.include(s.lastCall.args[0].val.toString(), "blaft");
        assert.include(s.lastCall.args[0].insId, "someIns");
      });
    });

    it("reports uncaught thrown that happened on an visual node", async () => {
      const s = spy();
      const a = dynamicNodeInput();

      const p2 = {
        ...errorReportingNode,
        id: "nodeNode2",
        run: () => {
          throw new Error("blaft");
        },
      };

      const badWrapper = conciseNode({
        id: "badWrap",
        inputs: ["a"],
        outputs: ["r"],
        instances: [internalNodeInstance("i1", p2)],
        connections: [["a", "i1.a"]],
      });

      const onEvent = wrappedOnEvent(DebuggerEventType.ERROR, s);

      execute({
        node: badWrapper,
        inputs: { a },
        outputs: {},
        _debugger: { onEvent },
        insId: "someIns",
      });

      assert.equal(s.callCount, 0);

      a.subject.next("bob");

      assert.equal(s.callCount, 2);

      assert.include(s.getCalls()[0]?.args[0].val.toString(), "blaft");
      assert.include(s.getCalls()[0]?.args[0].insId, "i1");

      assert.include(
        s.getCalls()[0]?.args[0].val.toString(),
        "insId: someIns.i1"
      );
      assert.include(s.getCalls()[1]?.args[0].val.toString(), "blaft");
      assert.include(s.getCalls()[1]?.args[0].insId, "someIns");
    });

    it("reports uncaught async error that happened on an visual node", async () => {
      const s = spy();
      const a = dynamicNodeInput();

      const p2 = {
        ...errorReportingNode,
        id: "nodeNode2",
        run: async () => {
          throw new Error("blaft");
        },
      };

      const badWrapper = conciseNode({
        id: "badWrap",
        inputs: ["a"],
        outputs: ["r"],
        instances: [internalNodeInstance("i1", p2)],
        connections: [["a", "i1.a"]],
      });

      const onEvent = wrappedOnEvent(DebuggerEventType.ERROR, s);

      execute({
        node: badWrapper,
        inputs: { a },
        outputs: {},
        _debugger: { onEvent },
        insId: "someIns",
      });

      assert.equal(s.callCount, 0);

      a.subject.next("bob");

      await eventually(() => {
        assert.equal(s.callCount, 2);

        assert.include(s.getCalls()[0]?.args[0].val.toString(), "blaft");
        assert.include(s.getCalls()[0]?.args[0].insId, "i1");

        assert.include(
          s.getCalls()[0]?.args[0].val.toString(),
          "insId: someIns.i1"
        );
        assert.include(s.getCalls()[1]?.args[0].val.toString(), "blaft");
        assert.include(s.getCalls()[1]?.args[0].insId, "someIns");
      });
    });

    it("reports uncaught errors that happened on an internal node", async () => {
      const s = spy();
      const a = dynamicNodeInput();

      const badWrapper = conciseNode({
        id: "badWrap",
        inputs: ["a"],
        outputs: ["r"],
        instances: [internalNodeInstance("i1", errorReportingNode)],
        connections: [["a", "i1.a"]],
      });

      const onEvent = wrappedOnEvent(DebuggerEventType.ERROR, s);

      execute({
        node: badWrapper,
        inputs: { a },
        outputs: {},
        _debugger: { onEvent },
        insId: "someIns",
      });

      assert.equal(s.callCount, 0);

      a.subject.next("bob");

      assert.equal(s.callCount, 2);

      assert.include(s.getCalls()[0]?.args[0].val.toString(), "blah");
      assert.include(s.getCalls()[0]?.args[0].insId, "i1");

      assert.include(
        s.getCalls()[0]?.args[0].val.toString(),
        "insId: someIns.i1"
      );
      assert.include(s.getCalls()[1]?.args[0].val.toString(), "blah");
      assert.include(s.getCalls()[1]?.args[0].insId, "someIns");
    });

    it('allows to catch errors in any node using the "error" pin', async () => {
      const s1 = spy();
      const s2 = spy();
      const a = dynamicNodeInput();
      const r = dynamicOutput();

      r.subscribe(s2);

      const badWrapper = conciseNode({
        id: "badWrap",
        inputs: ["a"],
        outputs: ["r"],
        instances: [internalNodeInstance("i1", errorReportingNode)],
        connections: [
          ["a", "i1.a"],
          [`i1.${ERROR_PIN_ID}`, "r"],
        ],
      });

      const onEvent = wrappedOnEvent(DebuggerEventType.ERROR, s1);

      execute({
        node: badWrapper,
        inputs: { a },
        outputs: { r },
        _debugger: { onEvent },
        insId: "someIns",
      });

      assert.equal(s1.callCount, 0);

      a.subject.next("bob");

      assert.equal(s2.callCount, 1);

      assert.include(s2.getCalls()[0]?.args[0].toString(), "blah");
    });

    it("does not bubble up caught errors", async () => {
      const s1 = spy();
      const s2 = spy();
      const a = dynamicNodeInput();

      const errPin = dynamicOutput();
      errPin.subscribe(s2);

      execute({
        node: errorReportingNode,
        inputs: { a },
        outputs: { [ERROR_PIN_ID]: errPin },
        onBubbleError: s1,
        insId: "someIns",
      });

      assert.equal(s1.callCount, 0);
      assert.equal(s2.callCount, 0);

      a.subject.next("bob");

      assert.equal(s1.callCount, 0);
      assert.equal(s2.callCount, 1);

      assert.include(s2.lastCall.args[0].toString(), "blah");
    });

    it("does report errors caught errors via debugger", async () => {
      const s = spy();
      const onEvent = wrappedOnEvent(DebuggerEventType.ERROR, s);
      const a = dynamicNodeInput();

      const errPin = dynamicOutput();

      execute({
        node: errorReportingNode,
        inputs: { a },
        outputs: { [ERROR_PIN_ID]: errPin },
        insId: "someIns",
        _debugger: { onEvent },
      });

      assert.equal(s.callCount, 0);
      a.subject.next("bob");
      assert.include(s.getCalls()[0]?.args[0].val.toString(), "blah");
      assert.include(s.getCalls()[0]?.args[0].insId, "someIns");
      assert.equal(s.callCount, 1);
    });
  });

  describe("async node function", () => {
    it("works with async functions", async () => {
      const node = conciseCodeNode({
        id: "Async",
        inputs: [],
        outputs: ["r"],
        run: async (_, o) => {
          await delay(10);
          o.r?.next("ok");
        },
      });

      const [s, r] = spiedOutput();
      const clean = execute({
        node,
        inputs: {},
        outputs: { r },
      });
      await eventually(() => {
        assert.equal(s.called, true);
      });

      clean();
      assert.isTrue(s.calledOnceWith("ok"));
    });
  });

  describe("bugs found", () => {
    it("works with spreading a 3 arrayed list into an accumulate 1", () => {
      const [s, r] = spiedOutput();
      const [list] = dynamicNodeInputs() as [DynamicNodeInput];

      const node = conciseNode({
        id: "merger",
        inputs: ["list"],
        outputs: ["r"],
        instances: [
          internalNodeInstance("one", one),
          internalNodeInstance("i1", spreadList),
          internalNodeInstance("i2", accumulate, {
            count: stickyInputPinConfig(),
          }),
        ],
        connections: [
          ["one.r", "i2.count"],
          ["list", "i1.list"],
          ["i1.val", "i2.val"],
          ["i2.r", "r"],
        ],
      });

      execute({
        node: node,
        inputs: { list },
        outputs: { r },
        onBubbleError: (e) => {
          console.log("error", e);
        },
      });

      assert.equal(s.callCount, 0);

      list.subject.next([1, 2, 3]);

      assert.equal(s.callCount, 3);
      assert.deepEqual(callsFirstArgs(s), [[1], [2], [3]]);
    });

    it("does not get in a loop with a sticky input that got data", () => {
      const _valueNode = valueNode("bob", "bob");
      const node = conciseNode({
        id: "test",
        inputs: [],
        outputs: ["r"],
        instances: [
          internalNodeInstance("bob", _valueNode),
          internalNodeInstance("i1", id),
          internalNodeInstance("i2", id, { v: stickyInputPinConfig() }),
        ],
        connections: [
          ["i1.r", "i2.v"],
          ["i2.r", "r"],
          ["bob.r", "i1.v"],
        ],
      });

      const [s, r] = spiedOutput();

      execute({
        node: node,
        inputs: {},
        outputs: { r },
      });

      assert.equal(s.callCount, 1);
    });

    // todo - add this to the implicit completion test suite
    it("queues values properly when inputs are received in a synchronous order in an async function", async () => {
      const loopValuesNode = conciseCodeNode({
        id: "loopValues",
        inputs: [],
        outputs: ["r"],
        run: (_, o) => {
          [1, 2, 3].map((v) => o.r?.next(v));
        },
      });

      const asyncId = conciseCodeNode({
        id: "asyncId",
        inputs: ["v"],
        outputs: ["r"],
        run: async (i, o) => {
          o.r?.next(i.v);
        },
      });

      const wrapperNode = conciseNode({
        id: "wrapper",
        inputs: [],
        outputs: ["r"],
        instances: [
          internalNodeInstance("i1", loopValuesNode),
          internalNodeInstance("i2", asyncId),
        ],
        connections: [
          ["i1.r", "i2.v"],
          ["i2.r", "r"],
        ],
      });

      const [s, r] = spiedOutput();

      execute({
        node: wrapperNode,
        inputs: {},
        outputs: { r },
      });

      await eventually(() => {
        assert.equal(s.callCount, 3);
      });
      console.log(s.getCalls().map((c) => c.args[0]));
    });
  });

  describe("node level trigger", () => {
    it("waits for __trigger input inside visual node", () => {
      const v42 = valueNode("val", 42);

      const visualNode = conciseNode({
        id: "visual-node",
        inputs: ["a|optional"],
        outputs: ["r"],
        instances: [internalNodeInstance("v1", v42)],
        connections: [
          ["a", "v1.__trigger"],
          ["v1.r", "r"],
        ],
      });

      const [s, r] = spiedOutput();
      const a = dynamicNodeInput();

      const err = (e: Error) => {
        throw e;
      };
      execute({
        node: visualNode,
        inputs: { a },
        outputs: { r },
        onBubbleError: err,
      });

      assert.equal(s.callCount, 0);

      a.subject.next("ok");

      assert.equal(s.callCount, 1);
      assert.equal(s.lastCall.args[0], 42);
    });
  });

  describe("misc", () => {
    it("does not clean state when reactive input is received", () => {
      const node = conciseCodeNode({
        id: "node",
        inputs: ["a"],
        outputs: ["r"],
        reactiveInputs: ["a"],
        completionOutputs: [],
        run: (_, outputs, adv) => {
          const val = adv.state.get("bob") || 0;
          const newVal = val + 1;
          adv.state.set("bob", newVal);
          outputs.r?.next(val + 1);
        },
      });

      const [s, r] = spiedOutput();
      const a = dynamicNodeInput();
      execute({
        node,
        inputs: { a },
        outputs: { r },
      });

      const timesToCall = randomInt(3, 10);
      for (let i = 0; i < timesToCall; i++) {
        a.subject.next("some val");
      }

      assert.equal(s.callCount, timesToCall);
      assert.equal(s.lastCall.args[0], timesToCall);
    });
  });

  describe("native support for non internal code nodes", () => {
    it.skip("supports executing an external/non-internal instance", () => {
      // const randomNumber = randomInt();
      // const input = dynamicNodeInput();
      // const [s, r] = spiedOutput();
      // const codeNodeId: CodeNode = {
      //   id: "add-num",
      //   inputs: {
      //     number1: {},
      //     number2: {},
      //   },
      //   outputs: { value: {} },
      //   run: (i, o) => {
      //     o.value.next(i.number1 + i.number2);
      //   },
      // };
      // const testVisualNode = (randomNumber: number) =>
      //   conciseNode({
      //     id: "visual-node",
      //     inputs: ["number"],
      //     outputs: ["value"],
      //     instances: [
      //       refNodeInstance("i1", codeNodeId.id, {
      //         number1: macroConfigurableValue("number", randomNumber),
      //         number2: macroConfigurableValue("number", randomNumber),
      //       }),
      //     ],
      //     connections: [
      //       ["number", "i1.__trigger"],
      //       ["i1.value", "value"],
      //     ],
      //   });
      // execute({
      //   node: testVisualNode(randomNumber),
      //   inputs: { number: input },
      //   outputs: { value: r },
      //   resolvedDeps: testNodesCollectionWith(codeNodeId),
      //   onBubbleError: (e) => {
      //     console.log("error", e);
      //   },
      // });
      // input.subject.next(randomNumber);
      // assert.equal(s.callCount, 1);
      // assert.equal(s.lastCall.args[0], randomNumber * 2);
    });
  });
});
