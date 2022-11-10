import { GroupedPart } from ".";
import { assert } from "chai";

import { spy } from "sinon";

import * as jg from "jsdom-global";

import { Subject } from "rxjs";
import { delay, eventually, isDefined, pickRandom, randomInt, randomInts, repeat, shuffle } from "./common";
import {
  connect,
  connectionNode,
  externalConnectionNode,
  connection,
  connectionData,
  ERROR_PIN_ID,
} from "./connect";
import {
  NativePart,
  fromSimplified,
  staticPartInput,
  dynamicPartInput,
  dynamicOutput,
  partInstance,
  CodePart,
  PartInstance,
  partInput,
  partOutput,
  queueInputPinConfig,
  staticInputPinConfig,
  partInputs,
  stickyInputPinConfig,
  dynamicPartInputs,
  groupedPart,
  partOutputs,
  inlinePartInstance,
} from "./part";
import { execute, PartError } from "./execute";
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
  testRepo,
  testRepoWith,
  peq,
  mul,
  addGroupedQueued,
  id2,
  accumulate,
  spreadList,
} from "./fixture";

import { codePartToNative } from "./code-to-native";
import {
  concisePart,
  conciseNativePart,
  spiedOutput,
  callsFirstArgs,
  valuePart,
} from "./test-utils";

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

  // testRepo.add('add')

  describe("core", () => {
    it("runs an Id native part properly", () => {
      const part: NativePart = {
        id: "id",
        inputs: {
          v: partInput("number"),
        },
        outputs: {
          r: partInput("number"),
        },
        fn: ({ v }, { r }) => {
          r.next(v);
        },
      };

      const s = spy();
      const v = dynamicPartInput();
      const r = dynamicOutput();

      r.subscribe(s);
      execute({part: part, inputs: { v }, outputs: { r }, partsRepo: testRepo});
      v.subject.next(2);
      assert.equal(s.calledOnceWithExactly(2), true);
    });

    it("runs an pure-like Id native part properly", () => {
      const part: NativePart = {
        id: "id",
        inputs: {
          v: partInput("number"),
        },
        outputs: {
          r: partInput("number"),
        },
        fn: ({ v }, { r }) => {
          r.next(v);
        },
      };

      const s = spy();
      const v = dynamicPartInput();
      const r = dynamicOutput();

      r.subscribe(s);
      execute({part: part, inputs: { v }, outputs: { r }, partsRepo: testRepo});
      v.subject.next(2);
      assert.equal(s.calledOnceWithExactly(2), true);
    });

    it("runs an ADD native part properly", () => {
      const innerSpy = spy();
      const part: NativePart = {
        id: "add",
        inputs: {
          a: partInput("number"),
          b: partInput("number"),
        },
        outputs: {
          r: partInput("number"),
        },
        fn: (args, { r }, {}) => {
          innerSpy();
          r.next(args.a + args.b);
        },
      };

      const s = spy();
      const a = dynamicPartInput();
      const b = dynamicPartInput();
      const r = dynamicOutput();

      r.subscribe(s);
      execute({part: part, inputs: { a, b }, outputs: { r }, partsRepo: testRepo});
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

    it("works with a simple grouped part", () => {
      const n1 = dynamicPartInput();
      const n2 = dynamicPartInput();
      const r = new Subject();
      const s = spy();
      r.subscribe(s);
      execute({part: addGrouped, inputs: { n1, n2 }, outputs: { r }, partsRepo: testRepo});
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
        instances: [partInstance("p1", add1mul2.id), partInstance("p2", add1mul2.id)],
        connections: [
          {
            from: connectionNode("p1", "r"),
            to: connectionNode("p2", "n"),
          },
          connectionData("n", "p1.n"),
          connectionData("p2.r", "r"),
        ],
        inputs: {
          n: partInput(),
        },
        outputs: {
          r: partOutput(),
        },
      };

      const part = connect(add1mul2twice, testRepo);

      const fn = spy();
      const n = dynamicPartInput();
      const r = dynamicOutput();
      execute({part: part, inputs: { n }, outputs: { r }, partsRepo: testRepo});
      r.subscribe(fn);

      n.subject.next(20); // ((21 * 2) + 1) * 2

      assert.deepEqual(Object.keys(part.inputs), ["n"]);
      assert.deepEqual(Object.keys(part.outputs), ["r"]);
      assert.equal(fn.lastCall.args[0], 86);
    });

    it('supports inline instance parts', () => {
      const add1: GroupedPart = {
        id: "add1",
        inputs: {
          n: partInput("number"),
        },
        outputs: {
          r: partOutput("number"),
        },
        inputsPosition: {},
        outputsPosition: {},
        instances: [inlinePartInstance("a", add, {n1: staticInputPinConfig(1)})],
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

      const n = dynamicPartInput();
      const [s, r] = spiedOutput();

      execute({part: add1, inputs: { n }, outputs: { r }, partsRepo: testRepo});

      n.subject.next(2);

      assert.equal(s.lastCall.args[0], 3);

    });

    describe("optional inputs", () => {
      it("runs parts with optional pins that were left unconnected", () => {
        const part = connect(
          {
            id: "bob",
            instances: [partInstance("a", optAdd.id)],
            connections: [connectionData("n1", "a.n1"), connectionData("a.r", "r")],
            inputs: {
              n1: partInput(),
            },
            outputs: {
              r: partOutput(),
            },
          },
          testRepo
        );

        const n1 = dynamicPartInput();
        const s = spy();
        const r = dynamicOutput();
        execute({part: part, inputs: { n1 }, outputs: { r }, partsRepo: testRepo});
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
              n1: partInput(),
              n2: partInput(),
            },
            outputs: {
              r: partOutput(),
            },
            connections: [
              connectionData("n1", "a.n1"),
              connectionData("n2", "a.n2"),
              connectionData("a.r", "r"),
            ],
          },
          testRepo
        );

        const n1 = dynamicPartInput();
        const n2 = dynamicPartInput();
        const s = spy();
        const r = dynamicOutput();
        execute({part: part, inputs: { n1, n2 }, outputs: { r }, partsRepo: testRepo});
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
        const repo = testRepoWith(Value(42), Value(5));
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
              r: partOutput(),
            },
          },
          repo
        );

        const s = spy();
        const r = dynamicOutput();
        r.subscribe(s);
        execute({part: part, inputs: {}, outputs: { r }, partsRepo: repo});
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
              n: partInput(),
            },
            outputs: {
              r: partOutput(),
            },
            connections: [connectionData("n", "a.n"), connectionData("a.r", "r")],
          },
          testRepo
        );

        const n = dynamicPartInput();
        const s1 = spy();
        const r1 = dynamicOutput();
        execute({part: p1, inputs: { n }, outputs: { r: r1 }, partsRepo: testRepo});
        r1.subscribe(s1);

        const s2 = spy();
        const r2 = dynamicOutput();
        execute({part: p1, inputs: { n }, outputs: { r: r2 }, partsRepo: testRepo});
        r2.subscribe(s2);

        n.subject.next(2);
        assert.equal(s1.lastCall.args[0], 3);
        assert.equal(s2.lastCall.args[0], 3);
        assert.equal(s1.callCount, 1);
        assert.equal(s2.callCount, 1);
      });

      it("connects 2 pieces and runs it", () => {
        const add1mul2: GroupedPart = {
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
            n: partInput(),
          },
          outputs: {
            r: partOutput(),
          },
          inputsPosition: {},
          outputsPosition: {},
        };

        const fn = spy();

        const part = connect(add1mul2, testRepo, {});

        const n = dynamicPartInput();
        const r = new Subject();

        assert.deepEqual(Object.keys(part.inputs), ["n"]);
        assert.deepEqual(Object.keys(part.outputs), ["r"]);

        r.subscribe(fn);

        execute({part: part, inputs: { n }, outputs: { r }, partsRepo: testRepo});

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
        const repo = testRepoWith(Value(n));
        const part = connect(
          {
            id: "test",
            instances: [partInstance("v1", Value(n).id), partInstance("a", add1.id)],
            connections: [
              {
                from: connectionNode("v1", "r"),
                to: connectionNode("a", "n"),
              },
              connectionData("a.r", "r"),
            ],
            outputs: {
              r: partOutput(),
            },
            inputs: {},
          },
          repo
        );

        const r = new Subject();
        const s = spy();
        r.subscribe(s);
        execute({part: part, inputs: {}, outputs: { r }, partsRepo: repo});

        assert.equal(s.lastCall.args[0], n + 1);
      });

      it("connects the same output to 2 inputs", () => {
        const n = randomInt(99);
        const repo = testRepoWith(Value(n));
        const part = connect(
          {
            id: "test",
            instances: [partInstance("v", Value(n).id), partInstance("a", add.id)],
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
              r: partOutput(),
            },
            inputs: {},
          },
          repo
        );

        const r = new Subject();
        const s = spy();
        r.subscribe(s);
        execute({part: part, inputs: {}, outputs: { r }, partsRepo: repo});

        r.subscribe(s);

        assert.equal(s.lastCall.args[0], n * 2);
      });

      it("works regardless of the order of the instances and connections with 2 pieces", () => {
        const n = randomInt(99);
        const repo = testRepoWith(Value(n));
        const instances = [partInstance("a", add1.id), partInstance("v", Value(n).id)];

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
                r: partOutput(),
              },
            },
            repo
          );

          const r = new Subject();
          const s = spy();
          r.subscribe(s);
          execute({part: part, inputs: {}, outputs: { r }, partsRepo: repo});

          assert.equal(s.lastCall.args[0], n + 1);
        }
      });

      it("works regardless of the order of the instances and connections with 3 pieces", () => {
        const n = randomInt(99);
        const repo = testRepoWith(Value(n));
        const instances: PartInstance[] = [
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
                r: partOutput(),
              },
            },
            repo
          );

          const r = new Subject();
          const s = spy();
          r.subscribe(s);
          execute({part: part, inputs: {}, outputs: { r }, partsRepo: repo});

          assert.equal(s.lastCall.args[0], n + n);
        }
      });

      it("connects const inputs properly", () => {
        const n = randomInt(99);
        const repo = testRepoWith(Value(n));
        const part: GroupedPart = {
          id: "test",
          inputs: {},
          outputs: {
            r: partOutput("number"),
          },
          instances: [partInstance("v1", Value(n).id), partInstance("a", add1.id)],
          connections: [connectionData("v1.r", "a.n"), connectionData("a.r", "r")],
          inputsPosition: {},
          outputsPosition: {},
        };

        const r = new Subject();
        const s = spy();
        r.subscribe(s);
        execute({part: part, inputs: {}, outputs: { r }, partsRepo: repo});

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
            n: partInput(),
          },
          outputs: {
            r: partOutput(),
          },
        },
        testRepo
      );

      const s1 = spy();
      const s2 = spy();

      const n1 = dynamicPartInput();
      const n2 = dynamicPartInput();
      const r1 = new Subject();
      const r2 = new Subject();

      // normal
      execute({part: add1, inputs: { n: n1 }, outputs: { r: r1 }, partsRepo: testRepo});
      r1.subscribe(s1);
      n1.subject.next(4);
      assert.equal(s1.lastCall.args[0], 5);

      // connected
      execute({part: p, inputs: { n: n2 }, outputs: { r: r2 }, partsRepo: testRepo});
      r2.subscribe(s2);
      n2.subject.next(4);
      assert.equal(s2.lastCall.args[0], 5);
    });

    it("does not trigger fn on unexpected arguments", () => {
      const n = dynamicPartInput();
      const bob = dynamicPartInput();
      const r = new Subject();
      execute({part: add1, inputs: { n, bob }, outputs: { r }, partsRepo: testRepo});
      const res = spy();
      r.subscribe(res);

      n.subject.next(1);
      bob.subject.next(2);
      assert.equal(res.callCount, 1);
    });

    it("supports constant values on connect", () => {
      const repo = testRepoWith(Value(7));
      const part = connect(
        {
          id: "test",
          instances: [partInstance("v", Value(7).id), partInstance("a", add.id)],
          connections: [
            connectionData("v.r", "a.n1"),
            connectionData("n2", "a.n2"),
            connectionData("a.r", "r"),
          ],
          inputs: {
            n2: partInput(),
          },
          outputs: {
            r: partOutput(),
          },
        },
        repo
      );

      const n2 = dynamicPartInput();
      const r = new Subject();

      const s = spy();
      assert.deepEqual(Object.keys(part.inputs), ["n2"]);
      execute({part: part, inputs: { n2 }, outputs: { r }, partsRepo: repo});

      r.subscribe(s);

      n2.subject.next(18);
      assert.equal(s.lastCall.args[0], 25);
    });

    it("supports static values on raw", () => {
      const repo = testRepoWith(Value(7));

      const part = connect(
        {
          id: "test",
          instances: [partInstance("v", Value(7).id), partInstance("a", transform.id)],
          connections: [
            connectionData("v.r", "a.to"),
            connectionData("from", "a.from"),
            connectionData("a.r", "r"),
          ],
          inputs: {
            from: partInput(),
          },
          outputs: {
            r: partOutput(),
          },
        },
        repo
      );

      const from = dynamicPartInput();
      const r = new Subject();

      const s = spy();
      assert.deepEqual(Object.keys(part.inputs), ["from"]);

      r.subscribe(s);
      execute({part: part, inputs: { from }, outputs: { r }, partsRepo: repo});

      from.subject.next(18);
      assert.equal(s.lastCall.args[0], 7);
      from.subject.next(20);
      assert.equal(s.lastCall.args[0], 7);
    });

    describe("stopping execution", () => {
      it("stops running simple components", () => {
        const v = dynamicPartInput();
        const r = dynamicOutput();
        const s = spy();
        const cancel = execute({part: id, inputs: { v }, outputs: { r }, partsRepo: testRepo});
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
        const ids: NativePart = fromSimplified({
          id: "test",
          inputTypes: { v: "any" },
          outputTypes: { r: "any" },
          fn: (args, { r }) => {
            internalSpy();
            r.next(args.v);
          },
        });

        const repo = testRepoWith(ids);

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
              v: partInput(),
            },
            outputs: {
              r: partOutput(),
            },
          },
          repo
        );

        const v = dynamicPartInput();
        const r = dynamicOutput();
        const cancel = execute({part: part, inputs: { v }, outputs: { r }, partsRepo: repo});
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
      const repo = testRepoWith(Value(1));
      const part: GroupedPart = {
        id: "part",
        inputs: {
          a: partOutput("number"),
        },
        outputs: {
          a: partOutput("number"),
        },
        instances: [partInstance("v", Value(1).id), partInstance("add", add.id)],
        connections: [
          connectionData("v.r", "add.n2"),
          connection(externalConnectionNode("a"), connectionNode("add", "n1")),
          connection(connectionNode("add", "r"), externalConnectionNode("a")),
        ],
        outputsPosition: {},
        inputsPosition: {},
      };

      const inputA = dynamicPartInput();
      const outputA = dynamicOutput();
      const fn = spy();
      outputA.subscribe(fn);
      execute({part: part, inputs: { a: inputA }, outputs: { a: outputA }, partsRepo: repo});
      inputA.subject.next(2);
      assert.equal(fn.callCount, 1);
      assert.equal(fn.calledWith(3), true);
    });

    describe("more than 1 connection per pin", () => {
      it("is possible when connecting main input to 2 inputs inside it", () => {
        const part: GroupedPart = {
          id: "part",
          inputs: {
            n: partInput("number"),
          },
          outputs: {
            r: partOutput("number"),
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

        const n = dynamicPartInput();
        const r = dynamicOutput();
        execute({part: part, inputs: { n }, outputs: { r }, partsRepo: testRepo});

        const fn = spy();
        r.subscribe(fn);

        n.subject.next(1);
        assert.equal(fn.lastCall.args[0], 2);
      });

      it("returns all given pulses to output", async () => {
        const repo = testRepoWith(Value(1), Value(2));
        const part: GroupedPart = {
          id: "part",
          inputs: {},
          outputs: {
            r: partOutput("number"),
          },
          inputsPosition: {},
          outputsPosition: {},
          instances: [partInstance("a", Value(1).id), partInstance("b", Value(2).id)],
          connections: [
            connection(connectionNode("a", "r"), externalConnectionNode("r")),
            connection(connectionNode("b", "r"), externalConnectionNode("r")),
          ],
        };

        const r = dynamicOutput();
        const fn = spy();
        r.subscribe(fn);
        execute({part: part, inputs: {}, outputs: { r }, partsRepo: repo});

        await delay(200);

        assert.equal(fn.calledWith(1), true);
        assert.equal(fn.calledWith(2), true);
        assert.equal(fn.callCount, 2);
      });
    });

    // it('runs "leaf" parts without waiting for external inputs', () => {
    //   const innerLeafSpy = spy();
    //   const leaf: NativePart = {
    //     id: "emit-1",
    //     inputs: {},
    //     outputs: { r: partOutput("number") },
    //     fn: (_, o) => {
    //       innerLeafSpy();
    //       o.r.next(1);
    //     }
    //   };

    //   const repo = testRepoWith(leaf);
    //   const part: GroupedPart = {
    //     id: "part",
    //     inputsPosition: {},
    //     outputsPosition: {},
    //     inputs: {
    //       n: partInput("number")
    //     },
    //     outputs: {
    //       r: partOutput("number")
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
    //   const n = dynamicPartInput();
    //   const r = dynamicOutput();
    //   r.subscribe(fn);
    //   execute({part: part, inputs: { n }, outputs: { r }, partsRepo: repo});

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
        const list = dynamicPartInput();
        const fn = dynamicPartInput();
        const r = new Subject();
        r.subscribe(s);
        execute({part: filter, inputs: { list, fn }, outputs: { r }, partsRepo: testRepo});
        list.subject.next([1, 2, 3, 4, 5, 6]);
        fn.subject.next(isEven);

        assert.equal(s.called, true);
        assert.deepEqual(s.lastCall.args[0], [2, 4, 6]);
      });

      it("works using part reference", () => {
        const s = spy();
        const list = dynamicPartInput();
        const fn = staticPartInput(`__part:${isEven.id}`);
        const r = new Subject();
        r.subscribe(s);
        execute({part: filter, inputs: { list, fn }, outputs: { r }, partsRepo: testRepo});
        list.subject.next([1, 2, 3, 4, 5, 6]);

        assert.equal(s.called, true);
        assert.deepEqual(s.lastCall.args[0], [2, 4, 6]);
      });
    });

    describe("part state", () => {
      const part: NativePart = {
        id: "fixture",
        inputs: { v: partInput("any") },
        outputs: { r: partOutput("any") },
        reactiveInputs: ["v"],
        completionOutputs: [],
        fn: (args, outs, { state }) => {
          const n = args.v + (state.get("curr") || 0);
          outs.r.next(n);
          state.set("curr", n);
        },
      };

      it("allows parts to access shared part state", () => {
        const s = spy();
        const v = dynamicPartInput();
        const r = new Subject();
        r.subscribe(s);
        execute({part: part, inputs: { v }, outputs: { r }, partsRepo: testRepo});
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
        const v1 = dynamicPartInput();
        const r1 = new Subject();
        const v2 = dynamicPartInput();
        const r2 = new Subject();
        r1.subscribe(s);
        3;
        execute({part: part, inputs: { v: v1 }, outputs: { r: r1 }, partsRepo: testRepo});
        v1.subject.next(1);
        v1.subject.next(2);
        execute({part: part, inputs: { v: v2 }, outputs: { r: r2 }, partsRepo: testRepo});
        v2.subject.next(1);
        v2.subject.next(2);

        assert.deepEqual(s.lastCall.args[0], 1 + 2); // if state was shared it would be 6
      });

      it("cleans inner inputs state after part is executed - no completion", () => {
        // this test introduces a double connection to an add part, and tests that the inner state of the inputs isn't kept
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
        });

        const [n1, n2] = [dynamicPartInput(), dynamicPartInput()];
        const r = dynamicOutput();

        r.subscribe(s);
        execute({part: part, inputs: { n1, n2 }, outputs: { r }, partsRepo: testRepo});

        n1.subject.next(1);
        n2.subject.next(2);
        n1.subject.next(3);
        n2.subject.next(4);

        assert.equal(s.callCount, 2);
        assert.equal(s.getCalls()[0].args[0], 3);
        assert.equal(s.getCalls()[1].args[0], 7);
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

        const [n1, n2] = [dynamicPartInput(), dynamicPartInput()];
        const r = dynamicOutput();

        r.subscribe(s);
        execute({part: part, inputs: { n1, n2 }, outputs: { r }, partsRepo: testRepo});

        n1.subject.next(1);
        n2.subject.next(2);
        n1.subject.next(3);
        n2.subject.next(4);

        assert.equal(s.callCount, 2);
        assert.equal(s.getCalls()[0].args[0], 3);
        assert.equal(s.getCalls()[1].args[0], 7);
      });

      it("cleans internal state of parts after execution", () => {
        /*
          internal part P will increase on each input received and return the current state
        */
        const counter = conciseNativePart({
          id: "counter",
          inputs: ["v"],
          outputs: ["r"],
          reactiveInputs: ["v"],
          completionOutputs: [],
          fn: (_, { r }, { state }) => {
            const c = state.get("c") || 0;
            state.set("c", c + 1);
            r.next(c);
          },
        });

        const counterWrapper = concisePart({
          id: "cwrap",
          inputs: ["v"],
          outputs: ["r"],
          instances: [partInstance("i1", counter.id)],
          connections: [
            ["v", "i1.v"],
            ["i1.r", "r"],
          ],
        });

        const v = dynamicPartInput();
        const r = dynamicOutput();
        const s = spy();
        r.subscribe(s);

        execute({part: counterWrapper, inputs: { v }, outputs: { r }, partsRepo: testRepoWith(counter)});
        v.subject.next(1);
        v.subject.next(1);
        v.subject.next(1);

        assert.equal(s.callCount, 3);
        assert.equal(s.getCalls()[0].args[0], 0);
        assert.equal(s.getCalls()[1].args[0], 0);
        assert.equal(s.getCalls()[2].args[0], 0);
      });

      it("does not clean internal of parts after execution until parent is not done", () => {
        /*
          internal part P will increase on each input received and return the current state
        */
        const counter = conciseNativePart({
          id: "counter",
          inputs: ["v"],
          outputs: ["r"],
          reactiveInputs: ["v"],
          completionOutputs: [],
          fn: ({ v }, { r }, { state }) => {
            const c = state.get("c") || 0;
            state.set("c", c + 1);
            r.next(c);
          },
        });

        const counterWrapper = concisePart({
          id: "cwrap",
          inputs: ["v", "v2|optional"],
          completionOutputs: ["r2"],
          outputs: ["r", "r2"],
          reactiveInputs: ["v", "v2"],
          instances: [partInstance("i1", counter.id), partInstance("i2", id.id)],
          connections: [
            ["v", "i1.v"],
            ["i1.r", "r"],
            ["v2", "i2.v"],
            ["i2.r", "r2"],
          ],
        });

        const [v, v2] = [dynamicPartInput(), dynamicPartInput()];
        const [r, r2] = [dynamicOutput(), dynamicOutput()];
        const s = spy();
        r.subscribe(s);

        execute({part: counterWrapper, inputs: { v, v2 }, outputs: { r, r2 }, partsRepo: testRepoWith(counter)});
        v.subject.next(1);
        v.subject.next(1);

        assert.equal(s.callCount, 2);
        assert.equal(s.getCalls()[0].args[0], 0);
        assert.equal(s.getCalls()[1].args[0], 1);

        v2.subject.next("bob");
        v.subject.next("bob");
        assert.equal(s.callCount, 4);
        assert.equal(s.getCalls()[3].args[0], 0);
      });

      it("uses shared global state to allow for hot reloading, and more", async () => {
        const s = spy();
        const v = dynamicPartInput();
        const r = new Subject();
        r.subscribe(s);
        const state = {};
        execute({part: part, inputs: { v }, outputs: { r }, partsRepo: testRepo, mainState: state});
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
      const part: GroupedPart = {
        id: "part",
        inputsPosition: {},
        outputsPosition: {},
        inputs: {
          n: partInput("number"),
        },
        outputs: {
          r: partOutput("number"),
        },
        instances: [partInstance("p1", id.id), partInstance("p2", add.id)],
        connections: [connectionData("n", "p1.v"), connectionData("p1.r", "r")],
      };

      const n = dynamicPartInput();
      const r = new Subject();
      const s = spy();

      r.subscribe(s);

      execute({part: part, inputs: { n }, outputs: { r }, partsRepo: testRepo});
      n.subject.next(42);

      assert.equal(s.calledWith(42), true);
    });

    it("allows state in code comp", async () => {
      const part: CodePart = {
        id: "fixture",
        inputs: { v: partInput("any") },
        outputs: { r: partOutput("any") },
        fnCode: `
          const n = inputs.v + (adv.state.get("curr") || 0);
          outputs.r.next(n);
          adv.state.set("curr", n);
          `,
        completionOutputs: [],
        reactiveInputs: ["v"],
      };
      const s = spy();
      const v = dynamicPartInput();
      const r = new Subject();
      r.subscribe(s);
      execute({part: part, inputs: { v }, outputs: { r }, partsRepo: testRepo});
      v.subject.next(1);
      v.subject.next(2);
      v.subject.next(3);
      v.subject.next(4);
      v.subject.next(5);
      assert.equal(s.called, true);
      assert.deepEqual(s.lastCall.args[0], 1 + 2 + 3 + 4 + 5);
    });
  });

  describe("uncontrolled grouped parts", () => {
    it("waits for all inputs when grouped part is uncontrolled", () => {
      const innerSpy = spy();
      const innerPart: NativePart = {
        id: "inner",
        inputs: {},
        outputs: {},
        fn: () => {
          innerSpy();
        },
      };

      const grouped: GroupedPart = {
        id: "bob",
        inputs: { n: partInput("any") },
        outputs: {},
        instances: [partInstance("i", innerPart.id)],
        connections: [],
        inputsPosition: {},
        outputsPosition: {},
      };

      const repo = testRepoWith(innerPart);

      const n = dynamicPartInput();
      const r = new Subject();

      const s = spy();
      r.subscribe(s);

      execute({part: grouped, inputs: { n }, outputs: {}, partsRepo: repo});

      assert.equal(innerSpy.callCount, 0);

      n.subject.next(1);

      assert.equal(innerSpy.callCount, 1);
    });
  });

  describe("recursion support", () => {
    it("does run parts that have no args", () => {
      const part: NativePart = {
        id: "part",
        inputs: {},
        outputs: {
          r: partOutput("number"),
        },
        fn: (_, { r }) => {
          r.next("ok");
        },
      };

      const r = new Subject();
      const s = spy();

      r.subscribe(s);

      execute({part: part, inputs: {}, outputs: { r }, partsRepo: testRepo});
      assert.equal(s.lastCall.args[0], "ok");
    });

    it('support recursive "add" calculation', () => {
      const addRec: GroupedPart = {
        id: "add-rec",
        inputs: {
          n: partInput("number"),
        },
        outputs: {
          r: partOutput("number"),
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

      const repo = testRepoWith(addRec);

      const r = new Subject();
      const s = spy();

      const n = dynamicPartInput();

      r.subscribe(s);

      execute({part: addRec, inputs: { n }, outputs: { r }, partsRepo: repo});

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

    it("support recursion based factorial calculation", () => {
      // const zero = constPart(0, "zero");
      // const one = constPart(1, "one");
      // const mOne = constPart(-1, "mOne");

      const fact: GroupedPart = {
        id: "fact",
        inputs: {
          n: partInput("number"),
        },
        outputs: {
          r: partOutput("number"),
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

      const repo = testRepoWith(fact);

      const r = new Subject();
      const s = spy();

      const n = dynamicPartInput();

      r.subscribe(s);

      execute({part: fact, inputs: { n }, outputs: { r }, partsRepo: repo});

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
    it("runs an Id native part properly", () => {
      const codePart: CodePart = {
        id: "id",
        inputs: {
          v: partInput("number"),
        },
        outputs: {
          r: partInput("number"),
        },
        fnCode: `outputs.r.next(inputs.v)`,
      };

      // const part: NativePart = codePartToNative(codePart);

      const s = spy();
      const v = dynamicPartInput();
      const r = dynamicOutput();

      r.subscribe(s);
      execute({part: codePart, inputs: { v }, outputs: { r }, partsRepo: testRepo});
      v.subject.next(2);
      assert.equal(s.calledOnceWithExactly(2), true);
    });

    it("runs ADD properly on code part", () => {
      const innerSpy = spy();
      const codePart: CodePart = {
        id: "add",
        inputs: {
          a: partInput("number"),
          b: partInput("number"),
        },
        outputs: {
          r: partInput("number"),
        },
        fnCode: `
        outputs.r.next(inputs.a + inputs.b);
        innerSpy();
          `,
      };

      const part = codePartToNative(codePart, {
        innerSpy,
      });

      const s = spy();
      const a = dynamicPartInput();
      const b = dynamicPartInput();
      const r = dynamicOutput();

      r.subscribe(s);
      execute({part: part, inputs: { a, b }, outputs: { r }, partsRepo: testRepo});
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
    it("runs cleanup code after a a part finished running on native part", () => {
      const spyFn = spy();
      const part: NativePart = {
        id: "id",
        inputs: {
          v: partInput("number"),
        },
        outputs: {
          r: partInput("number"),
        },
        fn: ({ v }, { r }, { onCleanup: cleanup }) => {
          r.next(v);
          cleanup(() => {
            spyFn();
          });
        },
      };
      const v = dynamicPartInput();
      const r = dynamicOutput();
      const clean = execute({part: part, inputs: { v }, outputs: { r }, partsRepo: testRepo});
      v.subject.next(2);
      assert.equal(spyFn.calledOnce, false);
      clean();
      assert.equal(spyFn.calledOnce, true);
    });

    it("runs cleanup code of code parts", async () => {
      const codePart: CodePart = {
        id: "id",
        inputs: {},
        outputs: {
          r: partInput("number"),
        },
        fnCode: `
          const timer = setInterval(() => outputs.r.next(1), 1);
          adv.onCleanup(() => clearInterval(timer));
          `,
      };

      const part = codePartToNative(codePart);
      const r = dynamicOutput();
      const s = spy();
      r.subscribe(s);
      const clean = execute({part: part, inputs: {}, outputs: { r }, partsRepo: testRepo});
      await delay(5);
      assert.equal(s.callCount > 1, true);
      clean();
      await delay(20);
      assert.equal(s.callCount < 5, true);
    });

  });

  describe('extra context', () => {

    it("passes external context forward when running code comps", async () => {
      const bobber = (n: number) => n + 42;
      const part: CodePart = {
        id: "tester",
        inputs: {},
        outputs: {
          r: partInput("number"),
        },
        fnCode: `
          outputs.r.next(bobber(12));
          `,
      };
      const r = dynamicOutput();
      const s = spy();
      r.subscribe(s);
      execute({part: part, inputs: {}, outputs: { r }, partsRepo: testRepo, extraContext: { bobber }});
      assert.equal(s.callCount, 1);
      assert.equal(s.lastCall.args[0], 54);
    });

    it("passes external context forward when running native comps", async () => {
      const bobber = (n: number) => n + 42;
      const part: NativePart = {
        id: "tester",
        inputs: {},
        outputs: {
          r: partInput("number"),
        },
        fn: (i, o, adv) => {
          o.r.next(adv.context.bobber(12));
        }
      }
      const r = dynamicOutput();
      const s = spy();
      r.subscribe(s);
      execute({part: part, inputs: {}, outputs: { r }, partsRepo: testRepo, extraContext: { bobber }});
      assert.equal(s.callCount, 1);
      assert.equal(s.lastCall.args[0], 54);
    });
    
    it("passes external context forward to grouped parts", async () => {
      // TODO - write test
    });
  })

  describe("const values", () => {
    it("supports const values on main execution", () => {
      const num1 = randomInt(1, 100);
      const num2 = randomInt(1, 100);
      const n1 = dynamicPartInput();
      const n2 = staticPartInput(num2);
      const r = new Subject();
      const s = spy();
      r.subscribe(s);
      execute({part: add, inputs: { n1, n2 }, outputs: { r }, partsRepo: testRepo});
      n1.subject.next(num1);
      n1.subject.next(num2);
      assert.equal(s.callCount, 2);
      assert.equal(s.getCalls()[0].args[0], num1 + num2);
      assert.equal(s.getCalls()[1].args[0], num2 + num2);
    });

    it("supports const values with inner grouped parts", () => {
      const num1 = randomInt(1, 100);
      const num2 = randomInt(1, 100);

      const n1 = dynamicPartInput();
      const n2 = staticPartInput(num2);
      const r = new Subject();
      const s = spy();
      r.subscribe(s);

      execute({part: addGrouped, inputs: { n1, n2 }, outputs: { r }, partsRepo: testRepo});
      n1.subject.next(num1);
      assert.equal(s.callCount, 1);
      assert.equal(s.getCalls()[0].args[0], num1 + num2);
    });

    it("supports const values defined inside grouped parts", () => {
      const n1 = dynamicPartInput();
      const r = new Subject();
      const s = spy();
      r.subscribe(s);

      const n2 = randomInt(20);

      const part = concisePart({
        id: "part",
        inputs: ["n1"],
        outputs: ["r"],
        instances: [partInstance("a", add.id, { n2: staticInputPinConfig(n2) })],
        connections: [
          ["n1", "a.n1"],
          ["a.r", "r"],
        ],
      });

      execute({part: part, inputs: { n1 }, outputs: { r }, partsRepo: testRepo});
      const num1 = randomInt(1, 100);
      n1.subject.next(num1);
      n1.subject.next(n2);
      assert.equal(s.callCount, 2);
      assert.equal(s.getCalls()[0].args[0], num1 + n2);
      assert.equal(s.getCalls()[1].args[0], n2 + n2);
    });

    it("supports const values on grouped part", () => {
      const n1 = dynamicPartInput();
      const r = new Subject();
      const s = spy();
      r.subscribe(s);

      const n2 = randomInt(20);

      const part = concisePart({
        id: "part",
        inputs: ["n1"],
        outputs: ["r"],
        instances: [partInstance("a", add.id, { n2: staticInputPinConfig(n2) })],
        connections: [
          ["n1", "a.n1"],
          ["a.r", "r"],
        ],
      });

      execute({part: part, inputs: { n1 }, outputs: { r }, partsRepo: testRepo});
      const num1 = randomInt(1, 100);
      n1.subject.next(num1);
      n1.subject.next(n2);
      assert.equal(s.callCount, 2);
      assert.equal(s.getCalls()[0].args[0], num1 + n2);
      assert.equal(s.getCalls()[1].args[0], n2 + n2);
    });
  });

  describe("part v2 tests", () => {
    it("queues values - native part", () => {
      const [n1, n2] = [
        dynamicPartInput({
          // config: queueInputPinConfig(),
        }),
        dynamicPartInput({
          // config: queueInputPinConfig(),Rr3
        }),
      ];

      const r = new Subject();
      const s = spy();
      r.subscribe(s);

      execute({part: add, inputs: { n1, n2 }, outputs: { r }, partsRepo: testRepo});

      n1.subject.next(1);
      n1.subject.next(2);
      n1.subject.next(3);

      n2.subject.next(4);

      n2.subject.next(5);
      n2.subject.next(6);
      assert.deepEqual(callsFirstArgs(s), [5, 7, 9]);
    });

    it("queues values - grouped part", () => {
      const [n1, n2] = [
        dynamicPartInput({
          // config: queueInputPinConfig(),
        }),
        dynamicPartInput({
          // config: queueInputPinConfig(),
        }),
      ];

      const r = new Subject();
      const s = spy();
      r.subscribe(s);

      execute({part: addGroupedQueued, inputs: { n1, n2 }, outputs: { r }, partsRepo: testRepo});

      n1.subject.next(1);
      n1.subject.next(2);
      n1.subject.next(3);

      n2.subject.next(4);

      n2.subject.next(5);
      n2.subject.next(6);
      assert.deepEqual(callsFirstArgs(s), [5, 7, 9]);
    });

    it("sticky values work on simple native", () => {
      const a = dynamicPartInput({ config: queueInputPinConfig() });
      const b = dynamicPartInput({ config: stickyInputPinConfig() });

      const r = dynamicOutput();

      const s = spy();

      r.subscribe(s);

      const part = conciseNativePart({
        inputs: ["a", "b"],
        outputs: ["r"],
        id: "bob",
        fn: ({ a, b }, { r }) => {
          r.next([a, b]);
        },
        completionOutputs: ["r"],
      });

      execute({part: part, inputs: { a, b }, outputs: { r }, partsRepo: testRepo});

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
      const item = dynamicPartInput({ config: queueInputPinConfig() });

      const r = new Subject();
      const s = spy();
      r.subscribe(s);

      const delayer: NativePart = {
        id: "delayer",
        inputs: {
          item: partInput("number"),
        },
        outputs: {
          r: partOutput("number"),
        },
        completionOutputs: ["r"],
        fn: ({ item }, { r }) => {
          setTimeout(() => {
            r.next(item);
          }, item as any);
        },
      };

      execute({part: delayer, inputs: { item }, outputs: { r }, partsRepo: testRepo});

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

    describe("completion outputs", () => {
      it("re-runs parts when one of the required outputs complete", async () => {
        const item = dynamicPartInput({ config: queueInputPinConfig() });

        const r = new Subject();
        const final = new Subject();
        const s = spy();
        r.subscribe(s);
        final.subscribe(s);

        const delayer: NativePart = {
          id: "delayer",
          inputs: {
            item: partInput("number"),
          },
          outputs: {
            r: partOutput("number"),
            final: partOutput("number"),
          },
          completionOutputs: ["final"],
          fn: ({ item }, { r, final }) => {
            r.next(item);

            setTimeout(() => {
              final.next(item);
            }, 10);
          },
        };

        execute({part: delayer, inputs: { item }, outputs: { r, final }, partsRepo: testRepo});

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
        const item = dynamicPartInput({ config: queueInputPinConfig() });

        
        const f1 = dynamicOutput();
        const f2 = dynamicOutput();

        const s = spy();
        f1.subscribe(s);
        f2.subscribe(s);

        const [sr, r] = spiedOutput();

        const delayer: NativePart = {
          id: "delayer",
          inputs: {
            item: partInput("number"),
          },
          outputs: {
            r: partOutput("number"),
            f1: partOutput("number"),
            f2: partOutput("number"),
          },
          completionOutputs: ["f1+f2"],
          fn: ({ item }, { r, f1, f2 }) => {
            r.next(item);

            setTimeout(() => {
              f1.next(item);
            }, 5);

            setTimeout(() => {
              f2.next(item);
            }, 10);
          },
        };

        execute({part: delayer, inputs: { item }, outputs: { f1, f2, r }, partsRepo: testRepo});

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
        const item = dynamicPartInput({ config: queueInputPinConfig() });

        const [r, final1, final2] = [dynamicOutput(), dynamicOutput(), dynamicOutput()];

        const s = spy();
        final1.subscribe((v) => s(`f1-${v}`));
        final2.subscribe((v) => s(`f2-${v}`));
        r.subscribe((v) => s(`r-${v}`));

        const delayer: NativePart = {
          id: "delayer",
          inputs: {
            item: partInput("number"),
          },
          outputs: {
            r: partOutput("number"),
            final1: partOutput("number"),
            final2: partOutput("number"),
          },
          completionOutputs: ["final1", "final2"],
          fn: ({ item }, { r, final1, final2 }) => {
            r.next(item);

            setTimeout(() => {
              if (item) {
                final1.next(item);
              } else {
                final2.next(item);
              }
            }, 10);
          },
        };

        execute({part: delayer, inputs: { item }, outputs: { r, final1, final2 }, partsRepo: testRepo});

        item.subject.next(0);
        item.subject.next(1);
        item.subject.next(0);

        await eventually(
          () => {
            assert.deepEqual(callsFirstArgs(s), ["r-0", "f2-0", "r-1", "f1-1", "r-0", "f2-0"]);
          },
          200,
          5
        );
      });

      it("completes parts when there are errors", async () => {
        const item = dynamicPartInput({ config: queueInputPinConfig() });

        const [r, final1] = [dynamicOutput(), dynamicOutput(), dynamicOutput()];

        const s = spy();
        final1.subscribe((v) => s(`f1-${v}`));
        r.subscribe((v) => s(`r-${v}`));

        const delayer: NativePart = {
          id: "delayer",
          inputs: {
            item: partInput("number"),
          },
          outputs: {
            r: partOutput("number"),
            final1: partOutput("number"),
            final2: partOutput("number"),
          },
          completionOutputs: ["final1", "final2"],
          fn: ({ item }, { r, final1 }, { onError }) => {
            r.next(item);

            if (!item) {
              throw new Error(`${item}`);
            }
            setTimeout(() => {
              if (item) {
                final1.next(item);
              }
            }, 10);
          },
        };

        const onError = (err: PartError) => {
          console.log(err.message);
          const val = err.message.match(/delayer: (\d)/)[1];
          s(`e-${val}`);
        };

        execute({part: delayer, inputs: { item }, outputs: { r, final1 }, partsRepo: testRepo, onBubbleError: onError});

        item.subject.next(0);
        item.subject.next(1);
        item.subject.next(0);

        await eventually(
          () => {
            assert.deepEqual(callsFirstArgs(s), ["r-0", "e-0", "r-1", "f1-1", "r-0", "e-0"]);
          },
          200,
          5
        );
      });
    });

    it("cleans up part only when the part is done", async () => {
      const item = dynamicPartInput({ config: queueInputPinConfig() });

      const r = new Subject();
      const final = new Subject();
      const cleanSpy = spy();
      const s = spy();
      r.subscribe(s);
      final.subscribe(s);

      const somePart: NativePart = {
        id: "somePart",
        inputs: {
          item: partInput("number"),
        },
        outputs: {
          r: partOutput("number"),
          final: partOutput("number"),
        },
        reactiveInputs: ["item"],
        completionOutputs: ["final"],
        fn: ({ item }, { r, final }, { state }) => {
          const s = state.get("val") + 1 || 1;
          state.set("val", s);

          if ((item as any) === 42) {
            final.next(s);
          } else {
            r.next(s);
          }

          return () => {
            cleanSpy();
          };
        },
      };

      const clean = execute({part: somePart, inputs: { item },  outputs: { r, final }, partsRepo: testRepo});

      item.subject.next(23423); // call 0
      item.subject.next(124); // call 1
      item.subject.next(122); // call 2
      item.subject.next(42); // call 3
      item.subject.next(123); // call 4

      clean();
      assert.equal(cleanSpy.callCount, 2); // once becauae of 42 and the second because of "clean"
    });

    describe("accumulate", () => {
      const accumulate: NativePart = {
        id: "acc",
        inputs: {
          item: partInput("any"),
          count: partInput("number"),
        },
        outputs: {
          r: partOutput("number"),
        },
        reactiveInputs: ["item"],
        completionOutputs: ["r"],
        fn: ({ item, count }, { r }, { state }) => {
          let list = state.get("list") || [];

          if (count !== state.get("count")) {
            list = [];
            state.set("count", count);
          }

          list.push(item);

          state.set("list", list);

          if (list.length === state.get("count")) {
            r.next(list);
          }
        },
      };

      it("supports creation of an accumulate", () => {
        const count = dynamicPartInput({ config: queueInputPinConfig() });
        const item = dynamicPartInput({ config: queueInputPinConfig() });

        const r = new Subject();
        const s = spy();
        r.subscribe(s);

        const clean = execute({part: accumulate, inputs: { item, count }, outputs: { r }, partsRepo: testRepo});

        count.subject.next(1);
        item.subject.next(23423); // call 0
        count.subject.next(2);
        item.subject.next(12); // call 0
        item.subject.next(23); // call 0
        assert.deepEqual(s.getCalls()[0].args[0], [23423]);
        assert.deepEqual(s.getCalls()[1].args[0], [12, 23]);
      });

      it("supports creation of an accumulate, another variation of input order", () => {
        const count = dynamicPartInput({ config: queueInputPinConfig() });
        const item = dynamicPartInput({ config: queueInputPinConfig() });

        const r = new Subject();
        const s = spy();
        r.subscribe(s);

        execute({part: accumulate, inputs: { item, count }, outputs: { r }, partsRepo: testRepo});

        item.subject.next(1);
        count.subject.next(1);
        item.subject.next(2);
        item.subject.next(3);
        count.subject.next(2);
        item.subject.next(4);
        item.subject.next(5);
        item.subject.next(6);
        count.subject.next(3);

        assert.deepEqual(s.getCalls()[0].args[0], [1]);
        assert.deepEqual(s.getCalls()[1].args[0], [2, 3]);
        assert.deepEqual(s.getCalls()[2].args[0], [4, 5, 6]);
      });

      it("supports creation of an accumulate, third variation of input order", () => {
        const count = dynamicPartInput({ config: queueInputPinConfig() });
        const item = dynamicPartInput({ config: queueInputPinConfig() });

        const r = new Subject();
        const s = spy();
        r.subscribe(s);

        execute({part: accumulate, inputs: { item, count }, outputs: { r }, partsRepo: testRepo});

        item.subject.next(1);
        count.subject.next(1);
        item.subject.next(2);
        count.subject.next(2);
        count.subject.next(3);
        item.subject.next(3);
        item.subject.next(4);
        item.subject.next(5);
        item.subject.next(6);

        assert.deepEqual(s.getCalls()[0].args[0], [1]);
        assert.deepEqual(s.getCalls()[1].args[0], [2, 3]);
        assert.deepEqual(s.getCalls()[2].args[0], [4, 5, 6]);
      });

      it("allows creating accumulate2 visually (shared state)", () => {
        const groupedPart = concisePart({
          id: "bob",
          inputs: ["val"],
          outputs: ["r"],
          completionOutputs: ["r"],
          reactiveInputs: ["val"],
          instances: [partInstance("i1", accumulate.id, { count: staticInputPinConfig(2) })],
          connections: [
            ["val", "i1.item"],
            ["i1.r", "r"],
          ],
        });

        const s = spy();
        const val = dynamicPartInput();
        const count = dynamicPartInput();
        const r = dynamicOutput();
        r.subscribe(s);

        execute({
          part: groupedPart,
          inputs: { val, count },
          outputs: { r },
          partsRepo: testRepoWith(accumulate),
        });

        val.subject.next(1);
        val.subject.next(2);

        assert.equal(s.callCount, 1);
        assert.deepEqual(s.lastCall.args[0], [1, 2]);
      });

      it("accumulate2 visually cleans up state properly after it is done", () => {
        const groupedPart = concisePart({
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
        const val = dynamicPartInput();
        const count = dynamicPartInput();
        const r = dynamicOutput();
        r.subscribe(s);

        execute({
          part: groupedPart,
          inputs: { val, count },
          outputs: { r },
          partsRepo: testRepoWith(accumulate)
        });

        count.subject.next(2);
        count.subject.next(3);
        val.subject.next(1);
        val.subject.next(2);

        val.subject.next(3);
        val.subject.next(4);
        val.subject.next(5);

        assert.equal(s.callCount, 2);
        assert.deepEqual(s.getCalls()[0].args[0], [1, 2]);
        assert.deepEqual(s.getCalls()[1].args[0], [3, 4, 5]);
      });

      it('supports creation of "accumulate until"', () => {
        const accUntil: NativePart = {
          id: "acc",
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

        const until = dynamicPartInput({ config: queueInputPinConfig() });
        const item = dynamicPartInput({ config: queueInputPinConfig() });

        const r = new Subject();
        const s = spy();
        r.subscribe(s);

        execute({part: accUntil, inputs: { item, until }, outputs: { r }, partsRepo: testRepo});

        item.subject.next(22);
        item.subject.next(23);
        until.subject.next(2);
        // until.subject.next();

        assert.deepEqual(s.getCalls()[0].args[0], [22, 23]);
        // assert.deepEqual(s.getCalls()[1].args[0], [2, 3]);
        // assert.deepEqual(s.getCalls()[2].args[0], [4, 5, 6]);
      });
    });

    it("supports running inner parts with static values", async () => {
      const num1 = randomInt(100);
      const num2 = randomInt(100);

      const groupedPart: GroupedPart = {
        id: "grouped-part",
        inputsPosition: {},
        outputsPosition: {},
        inputs: {},
        outputs: {
          r: partOutput("number"),
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
        dynamicPartInput({
          // config: queueInputPinConfig(),
        }),
      ];

      const r = new Subject();
      const s = spy();
      r.subscribe(s);

      execute({part: groupedPart, inputs: { n1 }, outputs: { r }, partsRepo: testRepo});

      assert.equal(s.getCalls()[0].args[0], num1 + num2);
      assert.equal(s.callCount, 1);
    });

    it('supports creation of "merge" part - code', () => {
      const merge: NativePart = {
        id: "merge",
        inputs: {
          a: partInput("any", "optional"),
          b: partInput("any", "optional"),
        },
        outputs: {
          r: partOutput("any"),
        },
        fn: ({ a, b }, { r }, { state }) => {
          if (isDefined(a)) {
            r.next(a);
          }

          if (isDefined(b)) {
            r.next(b);
          }
        },
      };

      const a = dynamicPartInput({ config: queueInputPinConfig() });
      const b = dynamicPartInput({ config: queueInputPinConfig() });

      const r = new Subject();
      const s = spy();
      r.subscribe(s);

      execute({part: merge, inputs: { a, b }, outputs: { r }, partsRepo: testRepo});

      const numbers = randomInts(20);

      const inputsToUse = repeat(20, () => pickRandom([a, b]));

      numbers.forEach((n, idx) => {
        inputsToUse[idx].subject.next(n);
      });

      numbers.forEach((n, idx) => {
        assert.deepEqual(s.getCalls()[idx].args[0], n);
      });
    });

    it('supports creation of "merge" part - visual', () => {
      const mergeGrouped: GroupedPart = {
        id: "grouped-part",
        inputsPosition: {},
        outputsPosition: {},
        inputs: {
          b: partInput("any", "optional"),
          a: partInput("any", "optional"),
        },
        outputs: {
          r: partOutput("number"),
        },
        instances: [partInstance("id", id2.id)],
        connections: [
          connectionData("a", "id.v"),
          connectionData("b", "id.v"),
          connectionData("id.r", "r"),
        ],
      };

      const a = dynamicPartInput({ config: queueInputPinConfig() });
      const b = dynamicPartInput({ config: queueInputPinConfig() });

      const r = new Subject();
      const s = spy();
      r.subscribe(s);

      execute({part: mergeGrouped, inputs: { b, a }, outputs: { r }, partsRepo: testRepo});

      const valuesCount = randomInt(10, 20);

      const values = repeat(valuesCount, () => randomInt(100));
      const subjects = repeat(valuesCount, () => pickRandom([a, b]));

      subjects.forEach((s, idx) => {
        s.subject.next(values[idx]);
      });

      assert.equal(s.callCount, valuesCount);

      values.forEach((val, idx) => {
        assert.equal(s.getCalls()[idx].args[0], val);
      });
    });

    describe("input modes", () => {
      it("required - does not run a part before with required inputs if they do not existing", () => {
        const s = spy();
        const dummyPart = conciseNativePart({
          id: "bob",
          inputs: ["a|required", "b|required"],
          outputs: ["r"],
          fn: () => {
            s();
          },
        });

        const [a, b] = [dynamicPartInput(), dynamicPartInput()];

        // execute({part: dummyPart, inputs: {}, outputs: {}, partsRepo: testRepo});
        execute({part: dummyPart, inputs: { a }, outputs: {}, partsRepo: testRepo});
        execute({part: dummyPart, inputs: { b }, outputs: {}, partsRepo: testRepo});

        a.subject.next(1);
        b.subject.next(2);

        assert.equal(s.callCount, 0);

        execute({part: dummyPart, inputs: { a, b }, outputs: {}, partsRepo: testRepo});

        a.subject.next(1);
        b.subject.next(2);
        assert.equal(s.callCount, 1);
      });

      it("required if connected - runs if not connected, but does not run if connected", () => {
        const s = spy();
        const dummyPart = conciseNativePart({
          id: "bob",
          inputs: ["a|required", "b|required-if-connected"],
          outputs: ["r"],
          fn: () => {
            s();
          },
        });

        const [a, b] = [dynamicPartInput(), dynamicPartInput()];

        // execute({part: dummyPart, inputs: {}, outputs: {}, partsRepo: testRepo});
        execute({part: dummyPart, inputs: { a, b }, outputs: {}, partsRepo: testRepo});

        a.subject.next(1);

        assert.equal(s.callCount, 0);

        execute({part: dummyPart, inputs: { a }, outputs: {}, partsRepo: testRepo});

        a.subject.next(1);

        assert.equal(s.callCount, 1);

        b.subject.next(2);
        assert.equal(s.callCount, 2);
      });
    });
  });

  describe("error handling", () => {
    const errorReportingPart = conciseNativePart({
      id: "bad",
      inputs: ["a"],
      outputs: ["r"],
      fn: (_, __, { onError }) => {
        onError(new Error("blah"));
      },
    });

    it("reports errors that were reported inside a direct part", async () => {
      const s = spy();
      const a = dynamicPartInput();

      execute({part: errorReportingPart, inputs: { a }, outputs: {}, partsRepo: testRepo, onBubbleError: s, insId: "someIns"});

      assert.equal(s.callCount, 0);

      a.subject.next("bob");

      assert.equal(s.callCount, 1);

      assert.include(s.lastCall.args[0].toString(), "blah");
      assert.include(s.lastCall.args[0].insId, "someIns");
    });

    it("reports errors that were thrown inside a direct part", async () => {
      const s = spy();
      const a = dynamicPartInput();

      const p2 = {
        ...errorReportingPart,
        fn: () => {
          throw new Error("blaft");
        },
      };
      execute({part: p2, inputs: { a }, outputs: {}, partsRepo: testRepo, _debugger: {onError: s}, insId: "someIns"});

      assert.equal(s.callCount, 0);

      a.subject.next("bob");

      assert.equal(s.callCount, 1);

      assert.include(s.lastCall.args[0].toString(), "blaft");
      assert.include(s.lastCall.args[0].insId, "someIns");
    });

    it("reports uncaught thrown that happened on an internal part", async () => {
      const s = spy();
      const a = dynamicPartInput();

      const p2 = {
        ...errorReportingPart,
        id: "partPart2",
        fn: () => {
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

      execute({part: badWrapper, inputs: { a }, outputs: {}, partsRepo: testRepoWith(p2), _debugger: {onError: s}, insId: "someIns"});

      assert.equal(s.callCount, 0);

      a.subject.next("bob");

      assert.equal(s.callCount, 2);

      assert.include(s.getCalls()[0].args[0].toString(), "blaft");
      assert.include(s.getCalls()[0].args[0].insId, "someIns.i1");

      assert.include(s.getCalls()[1].args[0].toString(), "child instance i1");
      assert.include(s.getCalls()[1].args[0].toString(), "blaft");
      assert.include(s.getCalls()[1].args[0].insId, "someIns");
    });

    it("reports uncaught errors that happened on an internal part", async () => {
      const s = spy();
      const a = dynamicPartInput();

      const badWrapper = concisePart({
        id: "badWrap",
        inputs: ["a"],
        outputs: ["r"],
        instances: [partInstance("i1", errorReportingPart.id)],
        connections: [["a", "i1.a"]],
      });

      execute({part: badWrapper, inputs: { a }, outputs: {}, partsRepo: testRepoWith(errorReportingPart), _debugger: {onError: s}, insId: "someIns"});

      assert.equal(s.callCount, 0);

      a.subject.next("bob");

      assert.equal(s.callCount, 2);

      assert.include(s.getCalls()[0].args[0].toString(), "blah");
      assert.include(s.getCalls()[0].args[0].insId, "someIns.i1");

      assert.include(s.getCalls()[1].args[0].toString(), "child instance i1");
      assert.include(s.getCalls()[1].args[0].toString(), "blah");
      assert.include(s.getCalls()[1].args[0].insId, "someIns");
    });

    it('allows to catch errors in any part using the "error" pin', async () => {
      const s1 = spy();
      const s2 = spy();
      const a = dynamicPartInput();
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

      execute({part: badWrapper, inputs:{ a }, outputs: { r }, partsRepo: testRepoWith(errorReportingPart), _debugger: {onError: s1}, insId: "someIns"});

      assert.equal(s1.callCount, 0);

      a.subject.next("bob");

      assert.equal(s1.callCount, 0);
      assert.equal(s2.callCount, 1);

      assert.include(s2.getCalls()[0].args[0].toString(), "blah");
    });

    it("does not bubble up caught errors", async () => {
      const s1 = spy();
      const s2 = spy();
      const a = dynamicPartInput();

      const errPin = dynamicOutput();
      errPin.subscribe(s2);

      execute({part: errorReportingPart, inputs: { a }, outputs: { [ERROR_PIN_ID]: errPin }, partsRepo: testRepo, onBubbleError: s1, insId: "someIns"});

      assert.equal(s1.callCount, 0);
      assert.equal(s2.callCount, 0);

      a.subject.next("bob");

      assert.equal(s1.callCount, 0);
      assert.equal(s2.callCount, 1);

      assert.include(s2.lastCall.args[0].toString(), "blah");
    });
  });

  describe("bugs found", () => {
    it("works with accumulate and a static input", () => {
      const [s, r] = spiedOutput();
      const [val] = dynamicPartInputs();
      const count = staticPartInput(1);

      execute({part: accumulate, inputs: { val, count }, outputs: { r }, partsRepo: testRepo});

      assert.equal(s.callCount, 0);

      val.subject.next("2");

      assert.equal(s.callCount, 1);
      assert.deepEqual(s.lastCall.args[0], ["2"]);
    });

    it("works with spreading a 3 arrayed list into an accumulate 1", () => {
      const [s, r] = spiedOutput();
      const [list] = dynamicPartInputs();

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

      execute({part: part, inputs: { list }, outputs: { r }, partsRepo: testRepoWith(spreadList, accumulate)});

      assert.equal(s.callCount, 0);

      list.subject.next([1, 2, 3]);

      assert.equal(s.callCount, 3);
      assert.deepEqual(callsFirstArgs(s), [[1], [2], [3]]);
    });
  });

  describe("environment vars", () => {
    it("supports reading environment variables if they are defined", async () => {
      const prop1Name = `prop${randomInt(100).toString(16)}`;
      const prop2Name = `prop${randomInt(100).toString(16)}`;
      const prop1Value = `${randomInt(100)}`;
      const prop2Value = `${randomInt(100)}`;

      const env = {
        [prop1Name]: prop1Value,
        [prop2Name]: prop2Value,
      };

      const groupedPart: GroupedPart = {
        id: "grouped-part",
        inputsPosition: {},
        outputsPosition: {},
        inputs: {
          n1: partInput("number", "required"),
        },
        outputs: {
          r: partOutput("number"),
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
        dynamicPartInput({
          // config: queueInputPinConfig(),
        }),
      ];

      const [s, r] = spiedOutput();

      execute({
        part: groupedPart,
        inputs: { n1 },
        outputs: { r },
        partsRepo: testRepo,
        env
      });

      n1.subject.next(222);

      assert.equal(s.getCalls()[0].args[0], prop1Value + prop2Value);
      assert.equal(s.callCount, 1);
    });

    it("supports reading non string env variables", async () => {
      const groupedId = concisePart({
        id: "gid",
        inputs: [],
        outputs: ["r"],
        connections: [["i1.r", "r"]],
        instances: [partInstance("i1", id.id, { v: staticInputPinConfig("$ENV.aValue") })],
      });

      const values = [true, false, randomInt(999), { obj: { obj2: randomInt(99) } }];
      values.forEach((val) => {
        const [s, r] = spiedOutput();
        const env = { aValue: val };
        execute({part: groupedId, inputs: {}, outputs: { r }, partsRepo: testRepo, env});
        assert.deepEqual(callsFirstArgs(s), [val]);
      });
    });

    it("supports reading properties from objects in env", async () => {
      const groupedId = concisePart({
        id: "gid",
        inputs: [],
        outputs: ["r"],
        connections: [["i1.r", "r"]],
        instances: [partInstance("i1", id.id, { v: staticInputPinConfig("$ENV.myObj.student.name") })],
      });

      const env = {
        myObj: {
          student: {
            name: "Albert",
          },
        },
      };

      const [s, r] = spiedOutput();
      execute({part: groupedId, inputs: {}, outputs: { r }, partsRepo: testRepo, env});
      assert.deepEqual(callsFirstArgs(s), ["Albert"]);
    });

    it("throws error if config value was not found", async () => {
      const groupedId = concisePart({
        id: "gid",
        inputs: [],
        outputs: ["r"],
        connections: [["i1.r", "r"]],
        instances: [partInstance("i1", id.id, { v: staticInputPinConfig("$ENV.myObj.student.name") })],
      });

      const env = {};
      const onError = spy();

      const [s, r] = spiedOutput();

      execute({
        part: groupedId,
        inputs: {},
        outputs: { r },
        partsRepo: testRepo,
        onBubbleError: onError,
        env
      });
      assert.equal(onError.callCount, 1);
      assert.include(onError.getCall(0).args[0].message, "myObj.student.name");
    });
  });

  describe("part level trigger", () => {
    it("waits for __trigger input inside grouped part", () => {
      const v42 = valuePart("val", 42);

      const groupedPart = concisePart({
        id: "grouped-part",
        inputs: ["a|optional"],
        outputs: ["r"],
        instances: [partInstance("v1", v42.id)],
        connections: [
          ["a", "v1.__trigger"],
          ["v1.r", "r"],
        ],
      });

      const [s, r] = spiedOutput();
      const a = dynamicPartInput();

      const err = (e) => {
        throw e;
      };
      execute({part: groupedPart, inputs: { a }, outputs: { r }, partsRepo: testRepoWith(v42), onBubbleError: err});

      assert.equal(s.callCount, 0);

      a.subject.next("ok");

      assert.equal(s.callCount, 1);
      assert.equal(s.lastCall.args[0], 42);
    });

    it("trigger input works in combination with static inputs", () => {
      const addPart = conciseNativePart({
        id: "add",
        inputs: ["a", "b"],
        outputs: ["r"],
        fn: (inputs, outputs) => outputs.r.next(inputs.a + inputs.b),
      });

      const groupedPart = concisePart({
        id: "grouped-part",
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
      const a = dynamicPartInput();

      const err = (e) => {
        throw e;
      };
      execute({
        part: groupedPart,
        inputs: { a },
        outputs: { r },
        partsRepo: testRepoWith(addPart),
        onBubbleError: err
      });

      assert.equal(s.callCount, 0);

      a.subject.next("ok");

      assert.equal(s.callCount, 1);
      assert.equal(s.lastCall.args[0], 3);
    });

    it("trigger input cannot be static", () => {
      const addPart = conciseNativePart({
        id: "add",
        inputs: ["a", "b"],
        outputs: ["r"],
        fn: (inputs, outputs) => outputs.r.next(inputs.a + inputs.b),
      });

      const groupedPart = concisePart({
        id: "grouped-part",
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
      const a = dynamicPartInput();

      const errSpy = spy();
      execute({
        part: groupedPart,
        inputs: { a },
        outputs: { r },
        partsRepo: testRepoWith(addPart),
        onBubbleError: errSpy
      });

      assert.equal(s.callCount, 0);

      a.subject.next("ok");

      assert.equal(errSpy.called, true);
      assert.match(errSpy.lastCall.args[0], /Trigger connection can not/);
    });
  });

  describe('misc', () => {
    it('does not clean state when reactive input is received', () => {
      const part = conciseNativePart({
        id: 'part',
        inputs: ['a'],
        outputs: ['r'],
        reactiveInputs: ['a'],
        completionOutputs: [],
        fn: (inputs, outputs, adv) => {
          const val = adv.state.get('bob') || 0;
          const newVal = val  + 1;
          adv.state.set('bob', newVal);
          outputs.r.next(val + 1);
        }
      });

      const [s, r] = spiedOutput();
      const a = dynamicPartInput();
      execute({part, inputs: {a}, outputs: {r}, partsRepo: testRepoWith(part)});

      const timesToCall = randomInt(3, 10);
      for (let i = 0; i < timesToCall; i++) {
        a.subject.next('some val');
      }

      assert.equal(s.callCount, timesToCall);
      assert.equal(s.lastCall.args[0], timesToCall);
  
      
    });
  })    

});
