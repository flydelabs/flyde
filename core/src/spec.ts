import { DynamicNodeInput, NodeInstanceError, VisualNode } from ".";
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
  connect,
  connectionNode,
  externalConnectionNode,
  connection,
  connectionData,
  ERROR_PIN_ID,
  TRIGGER_PIN_ID,
} from "./connect";
import {
  CodeNode,
  fromSimplified,
  staticNodeInput,
  dynamicNodeInput,
  dynamicOutput,
  partInstance,
  InlineValueNode,
  NodeInstance,
  nodeInput,
  nodeOutput,
  queueInputPinConfig,
  staticInputPinConfig,
  stickyInputPinConfig,
  dynamicNodeInputs,
  inlineNodeInstance,
} from "./node";
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
  testNodesCollection,
  testNodesCollectionWith,
  peq,
  mul,
  addGroupedQueued,
  id2,
  accumulate,
  spreadList,
} from "./fixture";

import { inlineValueNodeToPart } from "./inline-value-to-code-part";
import {
  concisePart,
  conciseCodePart,
  callsFirstArgs,
  valuePart,
  spiedOutput,
  wrappedOnEvent,
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
    it("runs an Id code part properly", () => {
      const part: CodeNode = {
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
        part: part,
        inputs: { v },
        outputs: { r },
        resolvedDeps: testNodesCollection,
      });
      v.subject.next(2);
      assert.equal(s.calledOnceWithExactly(2), true);
    });

    it("runs an pure-like Id code part properly", () => {
      const part: CodeNode = {
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
        part: part,
        inputs: { v },
        outputs: { r },
        resolvedDeps: testNodesCollection,
      });
      v.subject.next(2);
      assert.equal(s.calledOnceWithExactly(2), true);
    });

    it("runs an ADD code part properly", () => {
      const innerSpy = spy();
      const part: CodeNode = {
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
        part: part,
        inputs: { a, b },
        outputs: { r },
        resolvedDeps: testNodesCollection,
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

    it("works with a simple visual part", () => {
      const n1 = dynamicNodeInput();
      const n2 = dynamicNodeInput();
      const r = new Subject();
      const s = spy();
      r.subscribe(s);
      execute({
        part: addGrouped,
        inputs: { n1, n2 },
        outputs: { r },
        resolvedDeps: testNodesCollection,
      });
      const num1 = randomInt(1, 100);
      const num2 = randomInt(1, 100);
      n1.subject.next(num1);
      n2.subject.next(num2);
      assert.equal(s.callCount, 1);
      assert.equal(s.lastCall.args[0], num1 + num2);
    });

    it("works with nested parts", () => {
      const add1mul2twice = {
        id: "a1m2x2",
        instances: [
          partInstance("p1", add1mul2.id),
          partInstance("p2", add1mul2.id),
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

      const part = connect(add1mul2twice, testNodesCollection);

      const fn = spy();
      const n = dynamicNodeInput();
      const r = dynamicOutput();
      execute({
        part: part,
        inputs: { n },
        outputs: { r },
        resolvedDeps: testNodesCollection,
      });
      r.subscribe(fn);

      n.subject.next(20); // ((21 * 2) + 1) * 2

      assert.deepEqual(Object.keys(part.inputs), ["n"]);
      assert.deepEqual(Object.keys(part.outputs), ["r"]);
      assert.equal(fn.lastCall.args[0], 86);
    });

    it("supports inline instance parts", () => {
      const add1: VisualNode = {
        id: "add1",
        inputs: {
          n: nodeInput(),
        },
        outputs: {
          r: nodeOutput(),
        },
        inputsPosition: {},
        outputsPosition: {},
        instances: [
          inlineNodeInstance("a", add, { n1: staticInputPinConfig(1) }),
        ],
        connections: [
          {
            from: externalConnectionNode("n"),
            to: connectionNode("a", "n2"),
          },
          {
            from: connectionNode("a", "r"),
            to: externalConnectionNode("r"),
          },
        ],
      };

      const n = dynamicNodeInput();
      const [s, r] = spiedOutput();

      execute({
        part: add1,
        inputs: { n },
        outputs: { r },
        resolvedDeps: testNodesCollection,
      });

      n.subject.next(2);

      assert.equal(s.lastCall.args[0], 3);
    });

    describe("optional inputs", () => {
      it("runs parts with optional pins that were left unconnected", () => {
        const part = connect(
          {
            id: "bob",
            instances: [partInstance("a", optAdd.id)],
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
          },
          testNodesCollection
        );

        const n1 = dynamicNodeInput();
        const s = spy();
        const r = dynamicOutput();
        execute({
          part: part,
          inputs: { n1 },
          outputs: { r },
          resolvedDeps: testNodesCollection,
        });
        r.subscribe(s);
        n1.subject.next(42);
        assert.equal(s.lastCall.args[0], 84);
      });

      it("runs parts with optional pins that were connected", () => {
        const part = connect(
          {
            id: "bob",
            instances: [partInstance("a", optAdd.id)],
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
          },
          testNodesCollection
        );

        const n1 = dynamicNodeInput();
        const n2 = dynamicNodeInput();
        const s = spy();
        const r = dynamicOutput();
        execute({
          part: part,
          inputs: { n1, n2 },
          outputs: { r },
          resolvedDeps: testNodesCollection,
        });
        r.subscribe(s);
        n2.subject.next(1);
        n1.subject.next(2);
        assert.equal(s.lastCall.args[0], 3);
      });

      it("resolves dependencies properly", () => {
        // here there are 2 constants, 42 and 5, connected
        // to an "add" part that has n2 as an optional input
        // this case both n1 and n2 are given, so it's expected
        // to wait for "n2" or at least consider it

        // eventually I solved it by making sure that the constant for n2 is called first.
        // Not ideal at all!
        const resolvedDeps = testNodesCollectionWith(Value(42), Value(5));
        const part = connect(
          {
            id: "bob",
            instances: [
              partInstance("b", Value(5).id),
              partInstance("v", Value(42).id),
              partInstance("a", optAdd.id),
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
          },
          resolvedDeps
        );

        const s = spy();
        const r = dynamicOutput();
        r.subscribe(s);
        execute({
          part: part,
          inputs: {},
          outputs: { r },
          resolvedDeps: resolvedDeps,
        });
        assert.equal(s.lastCall.args[0], 47);
      });
    });

    describe("connect", () => {
      it("runs pieces in an isolate environment for each execution", () => {
        const p1 = connect(
          {
            id: "test",
            instances: [partInstance("a", add1.id)],
            inputs: {
              n: nodeInput(),
            },
            outputs: {
              r: nodeOutput(),
            },
            connections: [
              connectionData("n", "a.n"),
              connectionData("a.r", "r"),
            ],
          },
          testNodesCollection
        );

        const n = dynamicNodeInput();
        const s1 = spy();
        const r1 = dynamicOutput();
        execute({
          part: p1,
          inputs: { n },
          outputs: { r: r1 },
          resolvedDeps: testNodesCollection,
        });
        r1.subscribe(s1);

        const s2 = spy();
        const r2 = dynamicOutput();
        execute({
          part: p1,
          inputs: { n },
          outputs: { r: r2 },
          resolvedDeps: testNodesCollection,
        });
        r2.subscribe(s2);

        n.subject.next(2);
        assert.equal(s1.lastCall.args[0], 3);
        assert.equal(s2.lastCall.args[0], 3);
        assert.equal(s1.callCount, 1);
        assert.equal(s2.callCount, 1);
      });

      it("connects 2 pieces and runs it", () => {
        const add1mul2: VisualNode = {
          id: "test",
          instances: [partInstance("a", add1.id), partInstance("b", mul2.id)],
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
          inputsPosition: {},
          outputsPosition: {},
        };

        const fn = spy();

        const part = connect(add1mul2, testNodesCollection, {});

        const n = dynamicNodeInput();
        const r = new Subject();

        assert.deepEqual(Object.keys(part.inputs), ["n"]);
        assert.deepEqual(Object.keys(part.outputs), ["r"]);

        r.subscribe(fn);

        execute({
          part: part,
          inputs: { n },
          outputs: { r },
          resolvedDeps: testNodesCollection,
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
        const resolvedDeps = testNodesCollectionWith(Value(n));
        const part = connect(
          {
            id: "test",
            instances: [
              partInstance("v1", Value(n).id),
              partInstance("a", add1.id),
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
          },
          resolvedDeps
        );

        const r = new Subject();
        const s = spy();
        r.subscribe(s);
        execute({
          part: part,
          inputs: {},
          outputs: { r },
          resolvedDeps: resolvedDeps,
        });

        assert.equal(s.lastCall.args[0], n + 1);
      });

      it("connects the same output to 2 inputs", () => {
        const n = randomInt(99);
        const resolvedDeps = testNodesCollectionWith(Value(n));
        const part = connect(
          {
            id: "test",
            instances: [
              partInstance("v", Value(n).id),
              partInstance("a", add.id),
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
          },
          resolvedDeps
        );

        const r = new Subject();
        const s = spy();
        r.subscribe(s);
        execute({
          part: part,
          inputs: {},
          outputs: { r },
          resolvedDeps: resolvedDeps,
        });

        r.subscribe(s);

        assert.equal(s.lastCall.args[0], n * 2);
      });

      it("works regardless of the order of the instances and connections with 2 pieces", () => {
        const n = randomInt(99);
        const resolvedDeps = testNodesCollectionWith(Value(n));
        const instances = [
          partInstance("a", add1.id),
          partInstance("v", Value(n).id),
        ];

        for (let i = 0; i < 10; i++) {
          const part = connect(
            {
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
            },
            resolvedDeps
          );

          const r = new Subject();
          const s = spy();
          r.subscribe(s);
          execute({
            part: part,
            inputs: {},
            outputs: { r },
            resolvedDeps: resolvedDeps,
          });

          assert.equal(s.lastCall.args[0], n + 1);
        }
      });

      it("works regardless of the order of the instances and connections with 3 pieces", () => {
        const n = randomInt(99);
        const resolvedDeps = testNodesCollectionWith(Value(n));
        const instances: NodeInstance[] = [
          partInstance("a", add.id),
          partInstance("v1", Value(n).id),
          partInstance("v2", Value(n).id),
        ];

        for (let i = 0; i < 10; i++) {
          const part = connect(
            {
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
            },
            resolvedDeps
          );

          const r = new Subject();
          const s = spy();
          r.subscribe(s);
          execute({
            part: part,
            inputs: {},
            outputs: { r },
            resolvedDeps: resolvedDeps,
          });

          assert.equal(s.lastCall.args[0], n + n);
        }
      });

      it("connects const inputs properly", () => {
        const n = randomInt(99);
        const resolvedDeps = testNodesCollectionWith(Value(n));
        const part: VisualNode = {
          id: "test",
          inputs: {},
          outputs: {
            r: nodeOutput(),
          },
          instances: [
            partInstance("v1", Value(n).id),
            partInstance("a", add1.id),
          ],
          connections: [
            connectionData("v1.r", "a.n"),
            connectionData("a.r", "r"),
          ],
          inputsPosition: {},
          outputsPosition: {},
        };

        const r = new Subject();
        const s = spy();
        r.subscribe(s);
        execute({
          part: part,
          inputs: {},
          outputs: { r },
          resolvedDeps: resolvedDeps,
        });

        assert.equal(s.callCount, 1);
        assert.equal(s.lastCall.args[0], n + 1);
      });
    });

    it("supports external outputs on connected parts", () => {
      const p = connect(
        {
          id: "test",
          instances: [partInstance("a", add1.id)],
          connections: [connectionData("n", "a.n"), connectionData("a.r", "r")],
          inputs: {
            n: nodeInput(),
          },
          outputs: {
            r: nodeOutput(),
          },
        },
        testNodesCollection
      );

      const s1 = spy();
      const s2 = spy();

      const n1 = dynamicNodeInput();
      const n2 = dynamicNodeInput();
      const r1 = new Subject();
      const r2 = new Subject();

      // normal
      execute({
        part: add1,
        inputs: { n: n1 },
        outputs: { r: r1 },
        resolvedDeps: testNodesCollection,
      });
      r1.subscribe(s1);
      n1.subject.next(4);
      assert.equal(s1.lastCall.args[0], 5);

      // connected
      execute({
        part: p,
        inputs: { n: n2 },
        outputs: { r: r2 },
        resolvedDeps: testNodesCollection,
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
        part: add1,
        inputs: { n, bob },
        outputs: { r },
        resolvedDeps: testNodesCollection,
      });
      const res = spy();
      r.subscribe(res);

      n.subject.next(1);
      bob.subject.next(2);
      assert.equal(res.callCount, 1);
    });

    it("supports constant values on connect", () => {
      const resolvedDeps = testNodesCollectionWith(Value(7));
      const part = connect(
        {
          id: "test",
          instances: [
            partInstance("v", Value(7).id),
            partInstance("a", add.id),
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
        },
        resolvedDeps
      );

      const n2 = dynamicNodeInput();
      const r = new Subject();

      const s = spy();
      assert.deepEqual(Object.keys(part.inputs), ["n2"]);
      execute({
        part: part,
        inputs: { n2 },
        outputs: { r },
        resolvedDeps: resolvedDeps,
      });

      r.subscribe(s);

      n2.subject.next(18);
      assert.equal(s.lastCall.args[0], 25);
    });

    it("supports static values on raw", () => {
      const resolvedDeps = testNodesCollectionWith(Value(7));

      const part = connect(
        {
          id: "test",
          instances: [
            partInstance("v", Value(7).id),
            partInstance("a", transform.id),
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
        },
        resolvedDeps
      );

      const from = dynamicNodeInput();
      const r = new Subject();

      const s = spy();
      assert.deepEqual(Object.keys(part.inputs), ["from"]);

      r.subscribe(s);
      execute({
        part: part,
        inputs: { from },
        outputs: { r },
        resolvedDeps: resolvedDeps,
      });

      from.subject.next(18);
      assert.equal(s.lastCall.args[0], 7);
      from.subject.next(20);
      assert.equal(s.lastCall.args[0], 7);
    });

    describe("stopping execution", () => {
      it("stops running simple components", () => {
        const v = dynamicNodeInput();
        const r = dynamicOutput();
        const s = spy();
        const cancel = execute({
          part: id,
          inputs: { v },
          outputs: { r },
          resolvedDeps: testNodesCollection,
        });
        r.subscribe(s);
        v.subject.next(5);
        assert.equal(s.lastCall.args[0], 5);
        assert.equal(s.callCount, 1);
        cancel();
        v.subject.next(5);
        assert.equal(s.callCount, 1);
      });

      it("stops running connected components", () => {
        const internalSpy = spy();
        const s = spy();
        const ids: CodeNode = fromSimplified({
          id: "test",
          inputTypes: { v: "any" },
          outputTypes: { r: "any" },
          run: (args, { r }) => {
            internalSpy();
            r?.next(args.v);
          },
        });

        const resolvedDeps = testNodesCollectionWith(ids);

        const part = connect(
          {
            id: "bob",
            instances: [partInstance("a", ids.id), partInstance("b", ids.id)],
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
          },
          resolvedDeps
        );

        const v = dynamicNodeInput();
        const r = dynamicOutput();
        const cancel = execute({
          part: part,
          inputs: { v },
          outputs: { r },
          resolvedDeps: resolvedDeps,
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
      const resolvedDeps = testNodesCollectionWith(Value(1));
      const part: VisualNode = {
        id: "part",
        inputs: {
          a: nodeOutput(),
        },
        outputs: {
          a: nodeOutput(),
        },
        instances: [
          partInstance("v", Value(1).id),
          partInstance("add", add.id),
        ],
        connections: [
          connectionData("v.r", "add.n2"),
          connection(externalConnectionNode("a"), connectionNode("add", "n1")),
          connection(connectionNode("add", "r"), externalConnectionNode("a")),
        ],
        outputsPosition: {},
        inputsPosition: {},
      };

      const inputA = dynamicNodeInput();
      const outputA = dynamicOutput();
      const fn = spy();
      outputA.subscribe(fn);
      execute({
        part: part,
        inputs: { a: inputA },
        outputs: { a: outputA },
        resolvedDeps: resolvedDeps,
      });
      inputA.subject.next(2);
      assert.equal(fn.callCount, 1);
      assert.equal(fn.calledWith(3), true);
    });

    describe("more than 1 connection per pin", () => {
      it("is possible when connecting main input to 2 inputs inside it", () => {
        const part: VisualNode = {
          id: "part",
          inputs: {
            n: nodeInput(),
          },
          outputs: {
            r: nodeOutput(),
          },
          instances: [partInstance("a", add.id)],
          connections: [
            connection(externalConnectionNode("n"), connectionNode("a", "n1")),
            connection(externalConnectionNode("n"), connectionNode("a", "n2")),
            connection(connectionNode("a", "r"), externalConnectionNode("r")),
          ],
          outputsPosition: {},
          inputsPosition: {},
        };

        const n = dynamicNodeInput();
        const r = dynamicOutput();
        execute({
          part: part,
          inputs: { n },
          outputs: { r },
          resolvedDeps: testNodesCollection,
        });

        const fn = spy();
        r.subscribe(fn);

        n.subject.next(1);
        assert.equal(fn.lastCall.args[0], 2);
      });

      it("returns all given pulses to output", async () => {
        const resolvedDeps = testNodesCollectionWith(Value(1), Value(2));
        const part: VisualNode = {
          id: "part",
          inputs: {},
          outputs: {
            r: nodeOutput(),
          },
          inputsPosition: {},
          outputsPosition: {},
          instances: [
            partInstance("a", Value(1).id),
            partInstance("b", Value(2).id),
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
          part: part,
          inputs: {},
          outputs: { r },
          resolvedDeps: resolvedDeps,
        });

        await delay(200);

        assert.equal(fn.calledWith(1), true);
        assert.equal(fn.calledWith(2), true);
        assert.equal(fn.callCount, 2);
      });
    });

    // it('runs "leaf" parts without waiting for external inputs', () => {
    //   const innerLeafSpy = spy();
    //   const leaf: CodeNode = {
    //     id: "emit-1",
    //     inputs: {},
    //     outputs: { r: nodeOutput() },
    //     run: (_, o) => {
    //       innerLeafSpy();
    //       o.r?.next(1);
    //     }
    //   };

    //   const resolvedDeps = something(leaf);
    //   const part: VisualNode = {
    //     id: "part",
    //     inputsPosition: {},
    //     outputsPosition: {},
    //     inputs: {
    //       n: nodeInput()
    //     },
    //     outputs: {
    //       r: nodeOutput()
    //     },
    //     instances: [
    //       partInstance("a", leaf),
    //       partInstance("b", id) // we need it just to mediate the connection
    //     ],
    //     connections: [
    //       connection(externalConnectionNode("n"), connectionNode("b", "v")),
    //       connection(connectionNode("b", "r"), externalConnectionNode("r")),
    //       connection(connectionNode("a", "r"), externalConnectionNode("r"))
    //     ]
    //   };

    //   const fn = spy();
    //   const n = dynamicNodeInput();
    //   const r = dynamicOutput();
    //   r.subscribe(fn);
    //   execute({part: part, inputs: { n }, outputs: { r }, resolvedDeps: resolvedDeps});

    //   // assert.equal(fn.calledWith(2), true);
    //   assert.equal(fn.callCount, 1);
    //   assert.equal(fn.calledWith(1), true);
    //   assert.equal(innerLeafSpy.callCount, 1);

    //   n.subject.next(2);
    //   assert.equal(fn.callCount, 2);
    //   assert.equal(fn.calledWith(2), true);
    //   assert.equal(innerLeafSpy.callCount, 1);

    //   n.subject.next(3);
    //   assert.equal(fn.callCount, 3);
    //   assert.equal(fn.calledWith(3), true);
    //   assert.equal(innerLeafSpy.callCount, 1);
    // });

    describe("high order parts", () => {
      it("works for a simple case", () => {
        const s = spy();
        const list = dynamicNodeInput();
        const fn = dynamicNodeInput();
        const r = new Subject();
        r.subscribe(s);
        execute({
          part: filter,
          inputs: { list, fn },
          outputs: { r },
          resolvedDeps: testNodesCollection,
        });
        list.subject.next([1, 2, 3, 4, 5, 6]);
        fn.subject.next(isEven);

        assert.equal(s.called, true);
        assert.deepEqual(s.lastCall.args[0], [2, 4, 6]);
      });

      it("works using part reference", () => {
        const s = spy();
        const list = dynamicNodeInput();
        const fn = staticNodeInput(`__part:${isEven.id}`);
        const r = new Subject();
        r.subscribe(s);
        execute({
          part: filter,
          inputs: { list, fn },
          outputs: { r },
          resolvedDeps: testNodesCollection,
        });
        list.subject.next([1, 2, 3, 4, 5, 6]);

        assert.equal(s.called, true);
        assert.deepEqual(s.lastCall.args[0], [2, 4, 6]);
      });
    });

    describe("part state", () => {
      const part: CodeNode = {
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
        it("allows parts to access global state", () => {
          const s = spy();
          const v = dynamicNodeInput();
          const r = new Subject();

          const part1: CodeNode = {
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
          const part2: CodeNode = {
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

          const wrappedP2 = concisePart({
            id: "wrappedP2",
            inputs: [],
            outputs: ["r"],
            instances: [partInstance("p2", part2.id)],
            connections: [
              ["__trigger", "p2.__trigger"],
              ["p2.r", "r"],
            ],
          });

          const wrapper = concisePart({
            id: "wrapper",
            inputs: ["v"],
            outputs: ["r"],
            instances: [
              partInstance("p1", part1.id),
              partInstance("p2", wrappedP2.id),
            ],
            connections: [
              ["v", "p1.__trigger"],
              ["p1.r", "p2.__trigger"],
              ["p2.r", "r"],
            ],
          });

          r.subscribe(s);
          execute({
            part: wrapper,
            inputs: { v },
            outputs: { r },
            resolvedDeps: testNodesCollectionWith(part1, part2, wrappedP2),
          });
          v.subject.next("");
          assert.deepEqual(s.lastCall.args[0], 2);
          v.subject.next("");
          assert.deepEqual(s.lastCall.args[0], 4);
          v.subject.next("");
          assert.deepEqual(s.lastCall.args[0], 6);
        });
      });

      it("allows parts to access execution state", () => {
        const s = spy();
        const v = dynamicNodeInput();
        const r = new Subject();
        r.subscribe(s);
        execute({
          part: part,
          inputs: { v },
          outputs: { r },
          resolvedDeps: testNodesCollection,
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
          part: part,
          inputs: { v: v1 },
          outputs: { r: r1 },
          resolvedDeps: testNodesCollection,
        });
        v1.subject.next(1);
        v1.subject.next(2);
        execute({
          part: part,
          inputs: { v: v2 },
          outputs: { r: r2 },
          resolvedDeps: testNodesCollection,
        });
        v2.subject.next(1);
        v2.subject.next(2);

        assert.deepEqual(s.lastCall.args[0], 1 + 2); // if state was shared it would be 6
      });

      it("cleans inner inputs state after part is executed - no completion", async () => {
        // this test introduces a double connection to an add part, and tests that the inner state of the inputs isn't kept
        const s = spy();
        const part = concisePart({
          id: "test",
          inputs: ["n1", "n2"],
          outputs: ["r"],
          instances: [
            partInstance("i1", add.id),
            partInstance("i2", id.id), // id to simulate another part
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
          part: part,
          inputs: { n1, n2 },
          outputs: { r },
          resolvedDeps: testNodesCollection,
        });

        n1.subject.next(1);
        n2.subject.next(2);
        n1.subject.next(3);
        n2.subject.next(4);

        assert.equal(s.callCount, 2);
        assert.equal(s.getCalls()[0]?.args[0], 3);
        assert.equal(s.getCalls()[1]?.args[0], 7);
      });

      it("cleans inner inputs state after part is executed - with completion", () => {
        const s = spy();
        const part = concisePart({
          id: "test",
          inputs: ["n1", "n2"],
          outputs: ["r"],
          instances: [
            partInstance("i1", add.id),
            partInstance("i2", id.id), // id to simualte anot
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
          part: part,
          inputs: { n1, n2 },
          outputs: { r },
          resolvedDeps: testNodesCollection,
        });

        n1.subject.next(1);
        n2.subject.next(2);
        n1.subject.next(3);
        n2.subject.next(4);

        assert.equal(s.callCount, 2);
        assert.equal(s.getCalls()[0]?.args[0], 3);
        assert.equal(s.getCalls()[1]?.args[0], 7);
      });

      it("cleans internal state of parts after execution", async () => {
        /*
          internal part P will increase on each input received and return the current state
        */
        const counter = conciseCodePart({
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

        const counterWrapper = concisePart({
          id: "cwrap",
          inputs: ["v"],
          outputs: ["r"],
          completionOutputs: ["r"],
          instances: [partInstance("i1", counter.id)],
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
          part: counterWrapper,
          inputs: { v },
          outputs: { r },
          resolvedDeps: testNodesCollectionWith(counter),
        });
        v.subject.next(1);
        v.subject.next(1);
        v.subject.next(1);

        assert.equal(s.callCount, 3);
        assert.equal(s.getCalls()[0]?.args[0], 0);
        assert.equal(s.getCalls()[1]?.args[0], 0);
        assert.equal(s.getCalls()[2]?.args[0], 0);
      });

      it("does not clean internal of parts after execution until parent is not done", () => {
        /*
          internal part P will increase on each input received and return the current state
        */
        const counter = conciseCodePart({
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

        const counterWrapper = concisePart({
          id: "cwrap",
          inputs: ["v", "v2|optional"],
          completionOutputs: ["r2"],
          outputs: ["r", "r2"],
          reactiveInputs: ["v", "v2"],
          instances: [
            partInstance("i1", counter.id),
            partInstance("i2", id.id),
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
          part: counterWrapper,
          inputs: { v, v2 },
          outputs: { r, r2 },
          resolvedDeps: testNodesCollectionWith(counter),
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
          part: part,
          inputs: { v },
          outputs: { r },
          resolvedDeps: testNodesCollection,
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

    it("runs parts that are not fully connected", () => {
      const part: VisualNode = {
        id: "part",
        inputsPosition: {},
        outputsPosition: {},
        inputs: {
          n: nodeInput(),
        },
        outputs: {
          r: nodeOutput(),
        },
        instances: [partInstance("p1", id.id), partInstance("p2", add.id)],
        connections: [connectionData("n", "p1.v"), connectionData("p1.r", "r")],
      };

      const n = dynamicNodeInput();
      const r = new Subject();
      const s = spy();

      r.subscribe(s);

      execute({
        part: part,
        inputs: { n },
        outputs: { r },
        resolvedDeps: testNodesCollection,
      });
      n.subject.next(42);

      assert.equal(s.calledWith(42), true);
    });

    it("allows state in code comp", async () => {
      const part: InlineValueNode = {
        id: "fixture",
        inputs: { v: nodeInput() },
        outputs: { r: nodeOutput() },
        runFnRawCode: `
          const n = inputs.v + (adv.state.get("curr") || 0);
          outputs.r?.next(n);
          adv.state.set("curr", n);
          `,
        completionOutputs: [],
        reactiveInputs: ["v"],
      };
      const s = spy();
      const v = dynamicNodeInput();
      const r = new Subject();
      r.subscribe(s);
      execute({
        part: part,
        inputs: { v },
        outputs: { r },
        resolvedDeps: testNodesCollection,
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

  describe("uncontrolled visual parts", () => {
    it("waits for all inputs when visual part is uncontrolled", () => {
      const innerSpy = spy();
      const innerPart: CodeNode = {
        id: "inner",
        inputs: {},
        outputs: {},
        run: () => {
          innerSpy();
        },
      };

      const visual: VisualNode = {
        id: "bob",
        inputs: { n: nodeInput() },
        outputs: {},
        instances: [partInstance("i", innerPart.id)],
        connections: [],
        inputsPosition: {},
        outputsPosition: {},
      };

      const resolvedDeps = testNodesCollectionWith(innerPart);

      const n = dynamicNodeInput();
      const r = new Subject();

      const s = spy();
      r.subscribe(s);

      execute({
        part: visual,
        inputs: { n },
        outputs: {},
        resolvedDeps: resolvedDeps,
      });

      assert.equal(innerSpy.callCount, 0);

      n.subject.next(1);

      assert.equal(innerSpy.callCount, 1);
    });
  });

  describe("recursion support", () => {
    it("does run parts that have no args", () => {
      const part: CodeNode = {
        id: "part",
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
        part: part,
        inputs: {},
        outputs: { r },
        resolvedDeps: testNodesCollection,
      });
      assert.equal(s.lastCall.args[0], "ok");
    });

    it('support recursive "add" calculation', () => {
      const addRec: VisualNode = {
        id: "add-rec",
        inputs: {
          n: nodeInput(),
        },
        outputs: {
          r: nodeOutput(),
        },
        inputsPosition: {},
        outputsPosition: {},
        instances: [
          partInstance("if", peq.id, { compare: staticInputPinConfig(0) }),
          partInstance("arr", "add-rec"),
          partInstance("add1", add.id, { n2: staticInputPinConfig(-1) }),
          partInstance("add2", add.id, { n2: staticInputPinConfig(1) }),
          partInstance("tr1", transform.id, { to: staticInputPinConfig(1) }),
        ],
        connections: [
          connectionData("n", "if.val"),
          connectionData("add1.r", "arr.n"),
          connectionData("if.r", "tr1.from"),
          connectionData("tr1.r", "r"),
          connectionData("if.else", "add1.n1"),
          connectionData("arr.r", "add2.n1"),
          connectionData("add2.r", "r"),
        ],
      };

      const resolvedDeps = testNodesCollectionWith(addRec);

      const r = new Subject();
      const s = spy();

      const n = dynamicNodeInput();

      r.subscribe(s);

      execute({
        part: addRec,
        inputs: { n },
        outputs: { r },
        resolvedDeps: resolvedDeps,
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
      const fact: VisualNode = {
        id: "fact",
        inputs: {
          n: nodeInput(),
        },
        outputs: {
          r: nodeOutput(),
        },
        inputsPosition: {},
        outputsPosition: {},
        instances: [
          // partInstance("z", zero),
          // partInstance("one", one),
          // partInstance("m1", mOne),
          partInstance("if", peq.id, { compare: staticInputPinConfig(0) }),
          partInstance("f", "fact"),
          partInstance("add", add.id, { n2: staticInputPinConfig(-1) }),
          partInstance("mul", mul.id),
          partInstance("tr1", transform.id, { to: staticInputPinConfig(1) }),
        ],
        connections: [
          connectionData("n", "if.val"),
          // connectionData("z.r", "if.compare"),
          connectionData("if.r", "tr1.from"),
          // connectionData("one.r", "tr1.to"),
          connectionData("tr1.r", "r"),
          connectionData("if.else", "add.n1"),
          connectionData("if.else", "mul.n2"),
          // connectionData("m1.r", "add.n2"),
          connectionData("add.r", "f.n"),
          connectionData("f.r", "mul.n1"),
          connectionData("mul.r", "r"),
        ],
      };

      const resolvedDeps = testNodesCollectionWith(fact);

      const r = new Subject();
      const s = spy();

      const n = dynamicNodeInput();

      r.subscribe(s);

      execute({
        part: fact,
        inputs: { n },
        outputs: { r },
        resolvedDeps: resolvedDeps,
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

      n.subject.next(20);
      assert.equal(s.lastCall.args[0], 2432902008176640000);

      assert.equal(s.callCount, 6);
    });
  });

  describe("code part support", () => {
    it("runs an Id code part properly", () => {
      const inlineValuePart: InlineValueNode = {
        id: "id",
        inputs: {
          v: nodeInput(),
        },
        outputs: {
          r: nodeInput(),
        },
        runFnRawCode: `outputs.r?.next(inputs.v)`,
      };

      // const part: CodeNode = inlineValueNodeToPart(inlineValuePart);

      const s = spy();
      const v = dynamicNodeInput();
      const r = dynamicOutput();

      r.subscribe(s);
      execute({
        part: inlineValuePart,
        inputs: { v },
        outputs: { r },
        resolvedDeps: testNodesCollection,
      });
      v.subject.next(2);
      assert.equal(s.calledOnceWithExactly(2), true);
    });

    it("runs ADD properly on code part", () => {
      const innerSpy = spy();
      const inlineValuePart: InlineValueNode = {
        id: "add",
        inputs: {
          a: nodeInput(),
          b: nodeInput(),
        },
        outputs: {
          r: nodeInput(),
        },
        runFnRawCode: `
        outputs.r?.next(inputs.a + inputs.b);
        innerSpy();
          `,
      };

      const part = inlineValueNodeToPart(inlineValuePart, {
        innerSpy,
      });

      const s = spy();
      const a = dynamicNodeInput();
      const b = dynamicNodeInput();
      const r = dynamicOutput();

      r.subscribe(s);
      execute({
        part: part,
        inputs: { a, b },
        outputs: { r },
        resolvedDeps: testNodesCollection,
      });
      assert.equal(innerSpy.callCount, 0);
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
  });

  describe("part cleanup", () => {
    it("runs cleanup code after a a part finished running on code part", () => {
      const spyFn = spy();
      const part: CodeNode = {
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
        part: part,
        inputs: { v },
        outputs: { r },
        resolvedDeps: testNodesCollection,
      });
      v.subject.next(2);
      assert.equal(spyFn.calledOnce, false);
      clean();
      assert.equal(spyFn.calledOnce, true);
    });

    it("runs cleanup code of code parts", async () => {
      const inlineValuePart: InlineValueNode = {
        id: "id",
        inputs: {},
        outputs: {
          r: nodeInput(),
        },
        runFnRawCode: `
          const timer = setInterval(() => outputs.r?.next(1), 1);
          adv.onCleanup(() => clearInterval(timer));
          `,
      };

      const part = inlineValueNodeToPart(inlineValuePart);
      const r = dynamicOutput();
      const s = spy();
      r.subscribe(s);
      const clean = execute({
        part: part,
        inputs: {},
        outputs: { r },
        resolvedDeps: testNodesCollection,
      });
      await delay(4);
      assert.equal(s.callCount >= 1, true, `call count: ${s.callCount}`);
      clean();
      await delay(42);
      assert.equal(s.callCount <= 5, true, `call count: ${s.callCount}`);
    });

    it("calls destroy fn of debugger when cleaning up", () => {
      const spyFn = spy();
      const part: CodeNode = {
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
        part: part,
        inputs: { v },
        outputs: { r },
        resolvedDeps: testNodesCollection,
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
      const part: InlineValueNode = {
        id: "tester",
        inputs: {},
        outputs: {
          r: nodeInput(),
        },
        runFnRawCode: `
          outputs.r?.next(bobber(12));
          `,
      };
      const r = dynamicOutput();
      const s = spy();
      r.subscribe(s);
      execute({
        part: part,
        inputs: {},
        outputs: { r },
        resolvedDeps: testNodesCollection,
        extraContext: { bobber },
      });
      assert.equal(s.callCount, 1);
      assert.equal(s.lastCall.args[0], 54);
    });

    it("passes external context forward when running code comps", async () => {
      const bobber = (n: number) => n + 42;
      const part: CodeNode = {
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
        part: part,
        inputs: {},
        outputs: { r },
        resolvedDeps: testNodesCollection,
        extraContext: { bobber },
      });
      assert.equal(s.callCount, 1);
      assert.equal(s.lastCall.args[0], 54);
    });

    it.skip("passes external context forward to visual parts", async () => {
      // TODO - write test
    });
  });

  describe("const values", () => {
    it("supports const values on main execution", () => {
      const num1 = randomInt(1, 100);
      const num2 = randomInt(1, 100);
      const n1 = dynamicNodeInput();
      const n2 = staticNodeInput(num2);
      const r = new Subject();
      const s = spy();
      r.subscribe(s);
      execute({
        part: add,
        inputs: { n1, n2 },
        outputs: { r },
        resolvedDeps: testNodesCollection,
      });
      n1.subject.next(num1);
      n1.subject.next(num2);
      assert.equal(s.callCount, 2);
      assert.equal(s.getCalls()[0]?.args[0], num1 + num2);
      assert.equal(s.getCalls()[1]?.args[0], num2 + num2);
    });

    it("supports const values with inner visual parts", () => {
      const num1 = randomInt(1, 100);
      const num2 = randomInt(1, 100);

      const n1 = dynamicNodeInput();
      const n2 = staticNodeInput(num2);
      const r = new Subject();
      const s = spy();
      r.subscribe(s);

      execute({
        part: addGrouped,
        inputs: { n1, n2 },
        outputs: { r },
        resolvedDeps: testNodesCollection,
      });
      n1.subject.next(num1);
      assert.equal(s.callCount, 1);
      assert.equal(s.getCalls()[0]?.args[0], num1 + num2);
    });

    it("supports const values defined inside visual parts", () => {
      const n1 = dynamicNodeInput();
      const r = new Subject();
      const s = spy();
      r.subscribe(s);

      const n2 = randomInt(20);

      const part = concisePart({
        id: "part",
        inputs: ["n1"],
        outputs: ["r"],
        instances: [
          partInstance("a", add.id, { n2: staticInputPinConfig(n2) }),
        ],
        connections: [
          ["n1", "a.n1"],
          ["a.r", "r"],
        ],
      });

      execute({
        part: part,
        inputs: { n1 },
        outputs: { r },
        resolvedDeps: testNodesCollection,
      });
      const num1 = randomInt(1, 100);
      n1.subject.next(num1);
      n1.subject.next(n2);
      assert.equal(s.callCount, 2);
      assert.equal(s.getCalls()[0]?.args[0], num1 + n2);
      assert.equal(s.getCalls()[1]?.args[0], n2 + n2);
    });

    it("supports const values on visual part", () => {
      const n1 = dynamicNodeInput();
      const r = new Subject();
      const s = spy();
      r.subscribe(s);

      const n2 = randomInt(20);

      const part = concisePart({
        id: "part",
        inputs: ["n1"],
        outputs: ["r"],
        instances: [
          partInstance("a", add.id, { n2: staticInputPinConfig(n2) }),
        ],
        connections: [
          ["n1", "a.n1"],
          ["a.r", "r"],
        ],
      });

      execute({
        part: part,
        inputs: { n1 },
        outputs: { r },
        resolvedDeps: testNodesCollection,
      });
      const num1 = randomInt(1, 100);
      n1.subject.next(num1);
      n1.subject.next(n2);
      assert.equal(s.callCount, 2);
      assert.equal(s.getCalls()[0]?.args[0], num1 + n2);
      assert.equal(s.getCalls()[1]?.args[0], n2 + n2);
    });
  });

  describe("part v2 tests", () => {
    it("queues values - code part", () => {
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
        part: add,
        inputs: { n1, n2 },
        outputs: { r },
        resolvedDeps: testNodesCollection,
      });

      n1.subject.next(1);
      n1.subject.next(2);
      n1.subject.next(3);

      n2.subject.next(4);

      n2.subject.next(5);
      n2.subject.next(6);
      assert.deepEqual(callsFirstArgs(s), [5, 7, 9]);
    });

    it("queues values - visual part", () => {
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
        part: addGroupedQueued,
        inputs: { n1, n2 },
        outputs: { r },
        resolvedDeps: testNodesCollection,
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

      const part = conciseCodePart({
        inputs: ["a", "b"],
        outputs: ["r"],
        id: "bob",
        run: ({ a, b }, { r }) => {
          r?.next([a, b]);
        },
        completionOutputs: ["r"],
      });

      execute({
        part: part,
        inputs: { a, b },
        outputs: { r },
        resolvedDeps: testNodesCollection,
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

    it("completes last value only when part is done", async () => {
      const item = dynamicNodeInput({ config: queueInputPinConfig() });

      const r = new Subject();
      const s = spy();
      r.subscribe(s);

      const delayer: CodeNode = {
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
        part: delayer,
        inputs: { item },
        outputs: { r },
        resolvedDeps: testNodesCollection,
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

    describe("part completion", () => {
      it("re-runs parts when one of the required outputs complete", async () => {
        const item = dynamicNodeInput({ config: queueInputPinConfig() });

        const r = new Subject();
        const final = new Subject();
        const s = spy();
        r.subscribe(s);
        final.subscribe(s);

        const delayer: CodeNode = {
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
          part: delayer,
          inputs: { item },
          outputs: { r, final },
          resolvedDeps: testNodesCollection,
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

        const delayer: CodeNode = {
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
          part: delayer,
          inputs: { item },
          outputs: { f1, f2, r },
          resolvedDeps: testNodesCollection,
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

      it("re-runs parts only when one of the required outputs complete if there are more than 1", async () => {
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

        const delayer: CodeNode = {
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
          part: delayer,
          inputs: { item },
          outputs: { r, final1, final2 },
          resolvedDeps: testNodesCollection,
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

      it("completes parts when there are errors", async () => {
        const item = dynamicNodeInput({ config: queueInputPinConfig() });

        const [r, final1] = [dynamicOutput(), dynamicOutput(), dynamicOutput()];

        const s = spy();
        final1.subscribe((v) => s(`f1-${v}`));
        r.subscribe((v) => s(`r-${v}`));

        const delayer: CodeNode = {
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
          part: delayer,
          inputs: { item },
          outputs: { r, final1 },
          resolvedDeps: testNodesCollection,
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
        const simpleCompletion: CodeNode = {
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
          part: simpleCompletion,
          inputs: {},
          outputs: { r },
          resolvedDeps: testNodesCollection,
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
        describe("code parts", () => {
          it("triggers an implicit completion when there are no explicit completion outputs", async () => {
            const part = conciseCodePart({
              outputs: ["r"],
              run: (_, o) => o.r?.next("ok"),
            });
            const s = spy();
            execute({
              part,
              resolvedDeps: testNodesCollection,
              inputs: {},
              outputs: { r: dynamicOutput() },
              onCompleted: s,
            });
            assert.equal(s.callCount, 1);
            assert.deepEqual(s.lastCall.args[0], { r: "ok" });
          });

          it("waits for promises to resolve before triggering an implicit completion of code part with no explicit completion outputs", async () => {
            const part = conciseCodePart({
              outputs: ["r"],
              run: async (_, o) => {
                await new Promise((r) => setTimeout(r, 10));
                o.r?.next("ok");
              },
            });

            const s = spy();
            const [sr, r] = spiedOutput();
            execute({
              part,
              resolvedDeps: testNodesCollection,
              inputs: {},
              outputs: { r },
              onCompleted: s,
            });
            await eventually(() => {
              assert.isTrue(sr.calledWith("ok"));
            });
            assert.isTrue(s.calledAfter(sr));
          });

          it("keeps state of a an implicitly running part", async () => {
            const part = conciseCodePart({
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
              part,
              resolvedDeps: testNodesCollection,
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

        describe("visual parts", () => {
          it('triggers implicit completion when parts "inside" stop running', async () => {
            const delayPart = (ms: number) =>
              conciseCodePart({
                outputs: ["r"],
                run: async (_, o) => {
                  await new Promise((r) => setTimeout(r, ms));
                  o.r?.next("ok");
                },
                id: `delay-${ms}`,
              });

            const delay10 = delayPart(10);
            const delay5 = delayPart(5);

            const wrapper = concisePart({
              outputs: ["r"],
              instances: [
                { id: "a", part: delay5, pos: { x: 0, y: 0 }, inputConfig: {} },
                {
                  id: "b",
                  part: delay10,
                  pos: { x: 0, y: 0 },
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
              part: wrapper,
              resolvedDeps: testNodesCollection,
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

    it("cleans up part only when the part is done", async () => {
      const item = dynamicNodeInput({ config: queueInputPinConfig() });

      const r = new Subject();
      const final = new Subject();
      const cleanSpy = spy();
      const s = spy();
      r.subscribe(s);
      final.subscribe(s);

      const somePart: CodeNode = {
        id: "somePart",
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
        part: somePart,
        inputs: { item },
        outputs: { r, final },
        resolvedDeps: testNodesCollection,
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
      const accumulate: CodeNode = {
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
          part: accumulate,
          inputs: { item, count },
          outputs: { r },
          resolvedDeps: testNodesCollection,
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
          part: accumulate,
          inputs: { item, count },
          outputs: { r },
          resolvedDeps: testNodesCollection,
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
          part: accumulate,
          inputs: { item, count },
          outputs: { r },
          resolvedDeps: testNodesCollection,
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
        const visualNode = concisePart({
          id: "bob",
          inputs: ["val"],
          outputs: ["r"],
          completionOutputs: ["r"],
          reactiveInputs: ["val"],
          instances: [
            partInstance("i1", accumulate.id, {
              count: staticInputPinConfig(2),
            }),
          ],
          connections: [
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
          part: visualNode,
          inputs: { val, count },
          outputs: { r },
          resolvedDeps: testNodesCollectionWith(accumulate),
        });

        val.subject.next(1);
        val.subject.next(2);

        assert.equal(s.callCount, 1);
        assert.deepEqual(s.lastCall.args[0], [1, 2]);
      });

      it("accumulate2 visually cleans up state properly after it is done", () => {
        const visualNode = concisePart({
          id: "bob",
          inputs: ["val", "count"],
          outputs: ["r"],
          reactiveInputs: ["val"],
          instances: [partInstance("i1", accumulate.id, {})],
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
          part: visualNode,
          inputs: { val, count },
          outputs: { r },
          resolvedDeps: testNodesCollectionWith(accumulate),
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
        const accUntil: CodeNode = {
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
          part: accUntil,
          inputs: { item, until },
          outputs: { r },
          resolvedDeps: testNodesCollection,
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

    it("supports running inner parts with static values", async () => {
      const num1 = randomInt(100);
      const num2 = randomInt(100);

      const visualNode: VisualNode = {
        id: "visual-part",
        inputsPosition: {},
        outputsPosition: {},
        inputs: {},
        outputs: {
          r: nodeOutput(),
        },
        instances: [
          partInstance("a", add.id, {
            n1: staticInputPinConfig(num1),
            n2: staticInputPinConfig(num2),
          }),
        ],
        connections: [
          {
            from: connectionNode("a", "r"),
            to: externalConnectionNode("r"),
          },
        ],
      };

      const [n1] = [
        dynamicNodeInput({
          // config: queueInputPinConfig(),
        }),
      ];

      const r = new Subject();
      const s = spy();
      r.subscribe(s);

      execute({
        part: visualNode,
        inputs: { n1 },
        outputs: { r },
        resolvedDeps: testNodesCollection,
      });

      assert.equal(s.getCalls()[0]?.args[0], num1 + num2);
      assert.equal(s.callCount, 1);
    });

    it('supports creation of "merge" part - code', () => {
      const merge: CodeNode = {
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
        part: merge,
        inputs: { a, b },
        outputs: { r },
        resolvedDeps: testNodesCollection,
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

    it('supports creation of "merge" part - visual', () => {
      const mergeGrouped: VisualNode = {
        id: "visual-part",
        inputsPosition: {},
        outputsPosition: {},
        inputs: {
          b: nodeInput("optional"),
          a: nodeInput("optional"),
        },
        outputs: {
          r: nodeOutput(),
        },
        instances: [partInstance("id", id2.id)],
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
        part: mergeGrouped,
        inputs: { b, a },
        outputs: { r },
        resolvedDeps: testNodesCollection,
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
      it("required - does not run a part before with required inputs if they do not existing", () => {
        const s = spy();
        const dummyPart = conciseCodePart({
          id: "bob",
          inputs: ["a|required", "b|required"],
          outputs: ["r"],
          run: () => {
            s();
          },
        });

        const [a, b] = [dynamicNodeInput(), dynamicNodeInput()];

        execute({
          part: dummyPart,
          inputs: { a },
          outputs: {},
          resolvedDeps: testNodesCollection,
        });
        execute({
          part: dummyPart,
          inputs: { b },
          outputs: {},
          resolvedDeps: testNodesCollection,
        });

        a.subject.next(1);
        b.subject.next(2);

        assert.equal(s.callCount, 0);

        execute({
          part: dummyPart,
          inputs: { a, b },
          outputs: {},
          resolvedDeps: testNodesCollection,
        });

        a.subject.next(1);
        b.subject.next(2);
        assert.equal(s.callCount, 1);
      });

      it("required if connected - runs if not connected, but does not run if connected", () => {
        const s = spy();
        const dummyPart = conciseCodePart({
          id: "bob",
          inputs: ["a|required", "b|required-if-connected"],
          outputs: ["r"],
          run: () => {
            s();
          },
        });

        const [a, b] = [dynamicNodeInput(), dynamicNodeInput()];

        execute({
          part: dummyPart,
          inputs: { a, b },
          outputs: {},
          resolvedDeps: testNodesCollection,
        });

        a.subject.next(1);

        assert.equal(s.callCount, 0);

        execute({
          part: dummyPart,
          inputs: { a },
          outputs: {},
          resolvedDeps: testNodesCollection,
        });

        a.subject.next(1);

        assert.equal(s.callCount, 1);

        b.subject.next(2);
        assert.equal(s.callCount, 2);
      });
    });
  });

  describe("error handling", () => {
    const errorReportingPart = conciseCodePart({
      id: "bad",
      inputs: ["a"],
      outputs: ["r"],
      run: (_, __, { onError }) => {
        onError(new Error("blah"));
      },
    });

    it("reports errors that were reported inside a direct part", async () => {
      const s = spy();
      const a = dynamicNodeInput();

      const debuggerSpy = spy();
      const onEvent = wrappedOnEvent(DebuggerEventType.ERROR, debuggerSpy);

      execute({
        part: errorReportingPart,
        inputs: { a },
        outputs: {},
        resolvedDeps: testNodesCollection,
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
      assert.include(s.lastCall.args[0].message, "partId: bad");
    });

    it("reports errors that were thrown inside a direct part", async () => {
      const s = spy();
      const a = dynamicNodeInput();

      const p2 = {
        ...errorReportingPart,
        run: () => {
          throw new Error("blaft");
        },
      };

      const onEvent = wrappedOnEvent(DebuggerEventType.ERROR, s);

      1;
      execute({
        part: p2,
        inputs: { a },
        outputs: {},
        resolvedDeps: testNodesCollection,
        _debugger: { onEvent },
        insId: "someIns",
      });

      assert.equal(s.callCount, 0);

      a.subject.next("bob");

      assert.equal(s.callCount, 1);

      assert.include(s.lastCall.args[0].val.toString(), "blaft");
      assert.include(s.lastCall.args[0].insId, "someIns");
    });

    it("reports async errors that were thrown inside a direct part", async () => {
      const s = spy();
      const a = dynamicNodeInput();

      const p2 = {
        ...errorReportingPart,
        run: async () => {
          throw new Error("blaft");
        },
      };

      const onEvent = wrappedOnEvent(DebuggerEventType.ERROR, s);

      execute({
        part: p2,
        inputs: { a },
        outputs: {},
        resolvedDeps: testNodesCollection,
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

    it("reports async errors that were reported inside a direct part", async () => {
      const s = spy();
      const a = dynamicNodeInput();

      const p2 = {
        ...errorReportingPart,
        run: async (_, __, { onError }) => {
          onError(new Error("blaft"));
        },
      };

      const onEvent = wrappedOnEvent(DebuggerEventType.ERROR, s);

      try {
        execute({
          part: p2,
          inputs: { a },
          outputs: {},
          resolvedDeps: testNodesCollection,
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

    it("reports uncaught thrown that happened on an visual part", async () => {
      const s = spy();
      const a = dynamicNodeInput();

      const p2 = {
        ...errorReportingPart,
        id: "partPart2",
        run: () => {
          throw new Error("blaft");
        },
      };

      const badWrapper = concisePart({
        id: "badWrap",
        inputs: ["a"],
        outputs: ["r"],
        instances: [partInstance("i1", p2.id)],
        connections: [["a", "i1.a"]],
      });

      const onEvent = wrappedOnEvent(DebuggerEventType.ERROR, s);

      execute({
        part: badWrapper,
        inputs: { a },
        outputs: {},
        resolvedDeps: testNodesCollectionWith(p2),
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

    it("reports uncaught async error that happened on an visual part", async () => {
      const s = spy();
      const a = dynamicNodeInput();

      const p2 = {
        ...errorReportingPart,
        id: "partPart2",
        run: async () => {
          throw new Error("blaft");
        },
      };

      const badWrapper = concisePart({
        id: "badWrap",
        inputs: ["a"],
        outputs: ["r"],
        instances: [partInstance("i1", p2.id)],
        connections: [["a", "i1.a"]],
      });

      const onEvent = wrappedOnEvent(DebuggerEventType.ERROR, s);

      execute({
        part: badWrapper,
        inputs: { a },
        outputs: {},
        resolvedDeps: testNodesCollectionWith(p2),
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

    it("reports uncaught errors that happened on an internal part", async () => {
      const s = spy();
      const a = dynamicNodeInput();

      const badWrapper = concisePart({
        id: "badWrap",
        inputs: ["a"],
        outputs: ["r"],
        instances: [partInstance("i1", errorReportingPart.id)],
        connections: [["a", "i1.a"]],
      });

      const onEvent = wrappedOnEvent(DebuggerEventType.ERROR, s);

      execute({
        part: badWrapper,
        inputs: { a },
        outputs: {},
        resolvedDeps: testNodesCollectionWith(errorReportingPart),
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

    it('allows to catch errors in any part using the "error" pin', async () => {
      const s1 = spy();
      const s2 = spy();
      const a = dynamicNodeInput();
      const r = dynamicOutput();

      r.subscribe(s2);

      const badWrapper = concisePart({
        id: "badWrap",
        inputs: ["a"],
        outputs: ["r"],
        instances: [partInstance("i1", errorReportingPart.id)],
        connections: [
          ["a", "i1.a"],
          [`i1.${ERROR_PIN_ID}`, "r"],
        ],
      });

      const onEvent = wrappedOnEvent(DebuggerEventType.ERROR, s1);

      execute({
        part: badWrapper,
        inputs: { a },
        outputs: { r },
        resolvedDeps: testNodesCollectionWith(errorReportingPart),
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
        part: errorReportingPart,
        inputs: { a },
        outputs: { [ERROR_PIN_ID]: errPin },
        resolvedDeps: testNodesCollection,
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
        part: errorReportingPart,
        inputs: { a },
        outputs: { [ERROR_PIN_ID]: errPin },
        resolvedDeps: testNodesCollection,
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

  describe("async part function", () => {
    it("works with async functions", async () => {
      const part = conciseCodePart({
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
        part,
        resolvedDeps: {},
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
    it("works with accumulate and a static input", () => {
      const [s, r] = spiedOutput();
      const [val] = dynamicNodeInputs() as [DynamicNodeInput];
      const count = staticNodeInput(1);

      execute({
        part: accumulate,
        inputs: { val, count },
        outputs: { r },
        resolvedDeps: testNodesCollection,
      });

      assert.equal(s.callCount, 0);

      val.subject.next("2");

      assert.equal(s.callCount, 1);
      assert.deepEqual(s.lastCall.args[0], ["2"]);
    });

    it("works with spreading a 3 arrayed list into an accumulate 1", () => {
      const [s, r] = spiedOutput();
      const [list] = dynamicNodeInputs() as [DynamicNodeInput];

      const part = concisePart({
        id: "merger",
        inputs: ["list"],
        outputs: ["r"],
        instances: [
          partInstance("i1", spreadList.id),
          partInstance("i2", accumulate.id, { count: staticInputPinConfig(1) }),
        ],
        connections: [
          ["list", "i1.list"],
          ["i1.val", "i2.val"],
          ["i2.r", "r"],
        ],
      });

      execute({
        part: part,
        inputs: { list },
        outputs: { r },
        resolvedDeps: testNodesCollectionWith(spreadList, accumulate),
      });

      assert.equal(s.callCount, 0);

      list.subject.next([1, 2, 3]);

      assert.equal(s.callCount, 3);
      assert.deepEqual(callsFirstArgs(s), [[1], [2], [3]]);
    });

    it("does not get in a loop with a sticky input that got data", () => {
      const part = concisePart({
        id: "test",
        inputs: [],
        outputs: ["r"],
        instances: [
          partInstance("i1", id.id, { v: staticInputPinConfig("bob") }),
          partInstance("i2", id.id, { v: stickyInputPinConfig() }),
        ],
        connections: [
          ["i1.r", "i2.v"],
          ["i2.r", "r"],
        ],
      });

      const [s, r] = spiedOutput();

      execute({
        part: part,
        inputs: {},
        outputs: { r },
        resolvedDeps: testNodesCollectionWith(id),
      });

      // a.subject.next(1);

      assert.equal(s.callCount, 1);
    });

    // todo - add this to the implicit completion test suite
    it("queues values properly when inputs are received in a synchronous order in an async function", async () => {
      const loopValuesPart = conciseCodePart({
        id: "loopValues",
        inputs: [],
        outputs: ["r"],
        run: (_, o) => {
          [1, 2, 3].map((v) => o.r?.next(v));
        },
      });

      const asyncId = conciseCodePart({
        id: "asyncId",
        inputs: ["v"],
        outputs: ["r"],
        run: async (i, o) => {
          o.r?.next(i.v);
        },
      });

      const wrapperPart = concisePart({
        id: "wrapper",
        inputs: [],
        outputs: ["r"],
        instances: [
          partInstance("i1", loopValuesPart.id),
          partInstance("i2", asyncId.id),
        ],
        connections: [
          ["i1.r", "i2.v"],
          ["i2.r", "r"],
        ],
      });

      const [s, r] = spiedOutput();

      execute({
        part: wrapperPart,
        inputs: {},
        outputs: { r },
        resolvedDeps: testNodesCollectionWith(loopValuesPart, asyncId),
      });

      await eventually(() => {
        assert.equal(s.callCount, 3);
      });
      console.log(s.getCalls().map((c) => c.args[0]));
    });
  });

  describe("environment vars", () => {
    it("supports reading environment variables if they are defined", async () => {
      const prop1Name = "prop1";
      const prop2Name = `prop2`;
      const prop1Value = `${randomInt(100)}`;
      const prop2Value = `${randomInt(100)}`;

      const env = {
        [prop1Name]: prop1Value,
        [prop2Name]: prop2Value,
      };

      const visualNode: VisualNode = {
        id: "visual-part",
        inputsPosition: {},
        outputsPosition: {},
        inputs: {
          n1: nodeInput(),
        },
        outputs: {
          r: nodeOutput(),
        },
        instances: [
          partInstance("a", add.id, {
            n1: staticInputPinConfig(`$ENV.${prop1Name}`),
            n2: staticInputPinConfig(`$ENV.${prop2Name}`),
          }),
        ],
        connections: [
          {
            from: connectionNode("a", "r"),
            to: externalConnectionNode("r"),
          },
        ],
      };

      const [n1] = [
        dynamicNodeInput({
          // config: queueInputPinConfig(),
        }),
      ];

      const [s, r] = spiedOutput();

      execute({
        part: visualNode,
        inputs: { n1 },
        outputs: { r },
        resolvedDeps: testNodesCollection,
        env,
      });

      n1.subject.next(222);

      assert.equal(s.getCalls()[0]?.args[0], prop1Value + prop2Value);
      assert.equal(s.callCount, 1);
    });

    it("supports reading non string env variables", async () => {
      const groupedId = concisePart({
        id: "gid",
        inputs: [],
        outputs: ["r"],
        connections: [["i1.r", "r"]],
        instances: [
          partInstance("i1", id.id, { v: staticInputPinConfig("$ENV.aValue") }),
        ],
      });

      const values = [
        true,
        false,
        randomInt(999),
        { obj: { obj2: randomInt(99) } },
      ];
      values.forEach((val) => {
        const [s, r] = spiedOutput();
        const env = { aValue: val };
        execute({
          part: groupedId,
          inputs: {},
          outputs: { r },
          resolvedDeps: testNodesCollection,
          env,
        });
        assert.deepEqual(callsFirstArgs(s), [val]);
      });
    });

    it("supports reading properties from objects in env", async () => {
      const groupedId = concisePart({
        id: "gid",
        inputs: [],
        outputs: ["r"],
        connections: [["i1.r", "r"]],
        instances: [
          partInstance("i1", id.id, {
            v: staticInputPinConfig("$ENV.myObj.student.name"),
          }),
        ],
      });

      const env = {
        myObj: {
          student: {
            name: "Albert",
          },
        },
      };

      const [s, r] = spiedOutput();
      execute({
        part: groupedId,
        inputs: {},
        outputs: { r },
        resolvedDeps: testNodesCollection,
        env,
      });
      assert.deepEqual(callsFirstArgs(s), ["Albert"]);
    });

    it("throws error if config value was not found", async () => {
      const groupedId = concisePart({
        id: "gid",
        inputs: [],
        outputs: ["r"],
        connections: [["i1.r", "r"]],
        instances: [
          partInstance("i1", id.id, {
            v: staticInputPinConfig("$ENV.myObj.student.name"),
          }),
        ],
      });

      const env = {};
      const onError = spy();

      const [_, r] = spiedOutput();

      execute({
        part: groupedId,
        inputs: {},
        outputs: { r },
        resolvedDeps: testNodesCollection,
        onBubbleError: onError,
        env,
      });
      assert.equal(onError.callCount, 1);
      assert.include(onError.getCall(0).args[0].message, "myObj.student.name");
    });
  });

  describe("part level trigger", () => {
    it("waits for __trigger input inside visual part", () => {
      const v42 = valuePart("val", 42);

      const visualNode = concisePart({
        id: "visual-part",
        inputs: ["a|optional"],
        outputs: ["r"],
        instances: [partInstance("v1", v42.id)],
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
        part: visualNode,
        inputs: { a },
        outputs: { r },
        resolvedDeps: testNodesCollectionWith(v42),
        onBubbleError: err,
      });

      assert.equal(s.callCount, 0);

      a.subject.next("ok");

      assert.equal(s.callCount, 1);
      assert.equal(s.lastCall.args[0], 42);
    });

    it("trigger input works in combination with static inputs", () => {
      const addPart = conciseCodePart({
        id: "add",
        inputs: ["a", "b"],
        outputs: ["r"],
        run: (inputs, outputs) => outputs.r?.next(inputs.a + inputs.b),
      });

      const visualNode = concisePart({
        id: "visual-part",
        inputs: ["a|optional"],
        outputs: ["r"],
        instances: [
          partInstance("a1", addPart.id, {
            a: staticInputPinConfig(1),
            b: staticInputPinConfig(2),
          }),
        ],
        connections: [
          ["a", "a1.__trigger"],
          ["a1.r", "r"],
        ],
      });

      const [s, r] = spiedOutput();
      const a = dynamicNodeInput();

      const err = (e: Error) => {
        throw e;
      };
      execute({
        part: visualNode,
        inputs: { a },
        outputs: { r },
        resolvedDeps: testNodesCollectionWith(addPart),
        onBubbleError: err,
      });

      assert.equal(s.callCount, 0);

      a.subject.next("ok");

      assert.equal(s.callCount, 1);
      assert.equal(s.lastCall.args[0], 3);
    });

    it("trigger input cannot be static", () => {
      const addPart = conciseCodePart({
        id: "add",
        inputs: ["a", "b"],
        outputs: ["r"],
        run: (inputs, outputs) => outputs.r?.next(inputs.a + inputs.b),
      });

      const visualNode = concisePart({
        id: "visual-part",
        inputs: ["a"],
        outputs: ["r"],
        instances: [
          partInstance("a1", addPart.id, {
            a: staticInputPinConfig(1),
            b: staticInputPinConfig(2),
            __trigger: staticInputPinConfig(2),
          }),
        ],
        connections: [
          ["a", "a1.__trigger"],
          ["a1.r", "r"],
        ],
      });

      const [s, r] = spiedOutput();
      const a = dynamicNodeInput();

      const errSpy = spy();
      execute({
        part: visualNode,
        inputs: { a },
        outputs: { r },
        resolvedDeps: testNodesCollectionWith(addPart),
        onBubbleError: errSpy,
      });

      assert.equal(s.callCount, 0);

      a.subject.next("ok");

      assert.equal(errSpy.called, true);
      assert.match(errSpy.lastCall.args[0], /Trigger connection can not/);
    });
  });

  describe("misc", () => {
    it("does not clean state when reactive input is received", () => {
      const part = conciseCodePart({
        id: "part",
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
        part,
        inputs: { a },
        outputs: { r },
        resolvedDeps: testNodesCollectionWith(part),
      });

      const timesToCall = randomInt(3, 10);
      for (let i = 0; i < timesToCall; i++) {
        a.subject.next("some val");
      }

      assert.equal(s.callCount, timesToCall);
      assert.equal(s.lastCall.args[0], timesToCall);
    });

    it("does not enter a loop when static values are connected to a reactive input", () => {
      const part = conciseCodePart({
        id: "part",
        inputs: ["a"],
        outputs: ["r"],
        reactiveInputs: ["a"],
        completionOutputs: [],
        run: (inputs, outputs) => {
          outputs.r?.next(inputs.a);
        },
      });

      const [s, r] = spiedOutput();
      const a = staticNodeInput(5);
      execute({
        part,
        inputs: { a },
        outputs: { r },
        resolvedDeps: testNodesCollectionWith(part),
      });
      assert.equal(s.callCount, 1);
    });
  });
});
