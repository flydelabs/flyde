import {
  CodeNode,
  VisualNode,
  nodeInput,
  nodeOutput,
  Node,
  dynamicOutput,
  dynamicNodeInput,
  nodeInstance,
  dynamicNodeInputs,
  stickyInputPinConfig,
  staticNodeInput,
  DynamicNodeInput,
} from "../node";
import { execute } from ".";
import { Subject } from "rxjs";
import { spy } from "sinon";
import { assert } from "chai";
import {
  connectionNode,
  externalConnectionNode,
  connectionData,
  connect,
} from "../connect";
import { randomInt, isDefined, keys, eventually } from "../common";
import { equal } from "assert";
import {
  add,
  add1mul2,
  add1mul2add1,
  id,
  optAdd,
  isEven,
  Value,
  filter,
  mul2,
  testNodesCollection,
  testNodesCollectionWith,
  delay,
  delay5,
} from "../fixture";

import { conciseCodeNode, wrappedOnEvent } from "../test-utils";
import { DebuggerEventType } from "./debugger";

describe("execute", () => {
  const totalOptInput: CodeNode = {
    id: "optAdd",
    inputs: {
      n1: { mode: "required-if-connected" },
      n2: { mode: "required-if-connected" },
    },
    outputs: {
      r: {},
    },
    run: ({ n1, n2 }, { r }, {}) => {
      const a = isDefined(n1) ? n1 : 42;
      const b = isDefined(n2) ? n2 : 42;
      r?.next(a + b);
    },
  };

  const groupedOptInput: VisualNode = {
    id: "groupedOptAdd",
    inputs: {
      n1: nodeInput(),
      n2: nodeInput("optional"),
    },
    outputs: {
      r: nodeOutput(),
    },
    inputsPosition: {},
    outputsPosition: {},
    instances: [nodeInstance("a", optAdd.id)],
    connections: [
      {
        from: externalConnectionNode("n1"),
        to: connectionNode("a", "n1"),
      },
      // {
      //   from: externalConnectionNode("n2"),
      //   to: connectionNode("a", "n2"),
      // },
      {
        from: connectionNode("a", "r"),
        to: externalConnectionNode("r"),
      },
    ],
  };

  const addGrouped: VisualNode = {
    id: "add-visual",
    inputsPosition: {},
    outputsPosition: {},
    inputs: {
      n1: nodeInput(),
      n2: nodeInput(),
    },
    outputs: {
      r: nodeOutput(),
    },
    instances: [nodeInstance("a", add.id)],
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

  describe("visual nodes", () => {
    it("works with a single piece inside", () => {
      const n1 = dynamicNodeInput();
      const n2 = dynamicNodeInput();
      const r = new Subject();
      const s = spy();
      r.subscribe(s);
      execute({
        node: addGrouped,
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

    it("connects two pieces together properly", () => {
      const n = dynamicNodeInput();
      const r = new Subject();
      const s = spy();
      r.subscribe(s);
      execute({
        node: add1mul2,
        inputs: { n },
        outputs: { r },
        resolvedDeps: testNodesCollection,
      });
      const num = randomInt(1, 100);
      n.subject.next(num);
      assert.equal(s.callCount, 1);
      assert.equal(s.lastCall.args[0], (num + 1) * 2);
    });

    it("compiles visual nodes with the right inputs and outputs", () => {
      const visualNode: VisualNode = {
        id: "anode",
        inputs: { a: nodeInput(), b: nodeInput() },
        outputs: { r: nodeOutput() },
        instances: [],
        connections: [],
        inputsPosition: {},
        outputsPosition: {},
      };

      const node = connect(visualNode, testNodesCollection, {} as any);
      assert.deepEqual(keys(node.outputs), keys(visualNode.outputs));
      assert.deepEqual(keys(node.inputs), keys(visualNode.inputs));
    });

    it("compiles visual nodes with the right inputs and outputs when inputs have modes", () => {
      const visualNode: VisualNode = {
        id: "anode",
        inputs: {
          a: nodeInput("optional"),
          b: nodeInput("required"),
        },
        outputs: { r: nodeOutput() },
        instances: [],
        connections: [],
        inputsPosition: {},
        outputsPosition: {},
      };

      const node = connect(visualNode, testNodesCollection, {} as any);
      assert.equal(node.inputs["a"]?.mode, "optional");
      assert.equal(node.inputs["b"]?.mode, "required");
    });
  });

  describe("optional", () => {
    describe("inputs", () => {
      it("runs when optional inputs are absent", () => {
        const n1 = dynamicNodeInput();
        const r = new Subject();

        const s = spy();
        r.subscribe(s);

        execute({
          node: optAdd,
          inputs: { n1 },
          outputs: { r },
          resolvedDeps: testNodesCollection,
        });

        n1.subject.next(1);

        equal(s.callCount, 1);

        equal(s.lastCall.args, 43);
      });

      it("runs considers optional types that are given before mandatory", () => {
        const n1 = dynamicNodeInput();
        const n2 = dynamicNodeInput();
        const r = new Subject();

        const s = spy();
        r.subscribe(s);

        execute({
          node: optAdd,
          inputs: { n1, n2 },
          outputs: { r },
          resolvedDeps: testNodesCollection,
        });

        n2.subject.next(3);
        n1.subject.next(1);

        equal(s.callCount, 1);

        equal(s.lastCall.args, 4);
      });

      it("runs considers optional types that are given after mandatory", () => {
        const n1 = dynamicNodeInput();
        const n2 = dynamicNodeInput();
        const r = new Subject();

        const s = spy();
        r.subscribe(s);

        execute({
          node: optAdd,
          inputs: { n1, n2 },
          outputs: { r },
          resolvedDeps: testNodesCollection,
        });

        n1.subject.next(1);
        n2.subject.next(3);

        equal(s.callCount, 1);

        equal(s.lastCall.args, 4);
      });

      it("runs when optional inputs are absent- visual opt input", () => {
        const n1 = dynamicNodeInput();
        const r = new Subject();

        const s = spy();
        r.subscribe(s);

        execute({
          node: groupedOptInput,
          inputs: { n1 },
          outputs: { r },
          resolvedDeps: testNodesCollection,
        });

        n1.subject.next(1);

        equal(s.callCount, 1);

        equal(s.lastCall.args, 43);
      });

      it.skip("works properly when optional input is given after mandatory", () => {
        const n1 = dynamicNodeInput();
        const n2 = dynamicNodeInput();
        const r = new Subject();

        const s = spy();
        r.subscribe(s);

        execute({
          node: groupedOptInput,
          inputs: { n1, n2 },
          outputs: { r },
          resolvedDeps: testNodesCollection,
        });

        n1.subject.next(3);
        n2.subject.next(1);

        equal(s.callCount, 2);
        equal(s.lastCall.args, 4);
      });

      it("waits for inputs given when all are given", () => {
        const n1 = dynamicNodeInput();
        const n2 = dynamicNodeInput();
        const r = new Subject();

        const s = spy();
        r.subscribe(s);

        execute({
          node: totalOptInput,
          inputs: { n1, n2 },
          outputs: { r },
          resolvedDeps: testNodesCollection,
        });

        n1.subject.next(3);
        n2.subject.next(1);

        equal(s.callCount, 1);
        equal(s.lastCall.args, 4);
      });

      it("waits for inputs given when some are given", () => {
        const n1 = dynamicNodeInput();
        const r = new Subject();

        const s = spy();
        r.subscribe(s);

        execute({
          node: totalOptInput,
          inputs: { n1 },
          outputs: { r },
          resolvedDeps: testNodesCollection,
        });

        n1.subject.next(3);

        equal(s.callCount, 1);
        equal(s.lastCall.args, 45);
      });

      it("runs if no inputs are given and they are all optional", () => {
        const r = new Subject();

        const s = spy();
        r.subscribe(s);

        execute({
          node: totalOptInput,
          inputs: {},
          outputs: { r },
          resolvedDeps: testNodesCollection,
        });

        equal(s.callCount, 1);
        equal(s.lastCall.args, 84);
      });

      it("runs properly when outer optional inputs are passed that are not connected internally (like list map)", () => {
        const r = new Subject();

        const s = spy();
        r.subscribe(s);

        const node: VisualNode = {
          id: "bob",
          inputsPosition: {},
          outputsPosition: {},
          inputs: {
            a: nodeInput(),
            b: nodeInput("optional"),
          },
          outputs: {
            r: nodeOutput(),
          },
          instances: [
            nodeInstance("a", id.id),
            // nodeInstance('b', id),
          ],
          connections: [
            {
              from: externalConnectionNode("a"),
              to: connectionNode("a", "v"),
            },
            {
              from: connectionNode("a", "r"),
              to: externalConnectionNode("r"),
            },
          ],
        };

        const a = dynamicNodeInput();
        const b = dynamicNodeInput();

        execute({
          node: node,
          inputs: { a, b },
          outputs: { r },
          resolvedDeps: testNodesCollection,
        });

        a.subject.next(42);
        b.subject.next(1);
        assert.equal(s.callCount, 1);
        assert.equal(s.lastCall.args[0], 42);
      });

      it("runs properly when given an unconnected visual optional node", () => {
        const r = new Subject();

        const s = spy();
        r.subscribe(s);

        const val2 = Value(2);
        const resolvedDeps = testNodesCollectionWith(val2);

        const node: VisualNode = {
          id: "bob",
          inputsPosition: {},
          outputsPosition: {},
          inputs: {
            a: nodeInput("optional"),
          },
          outputs: {
            r: nodeOutput(),
          },
          instances: [nodeInstance("v", Value(2).id), nodeInstance("a", id.id)],
          connections: [
            connectionData(["a", "r"], ["r"]),
            connectionData(["v", "r"], ["a", "v"]),
          ],
        };

        execute({
          node: node,
          inputs: {},
          outputs: { r },
          resolvedDeps: resolvedDeps,
        });

        assert.equal(s.callCount, 1);
        assert.equal(s.lastCall.args[0], 2);
      });
    });

    describe("outputs", () => {
      const optOutput: Node = {
        id: "dup",
        inputs: {
          v: nodeInput(),
        },
        outputs: {
          r1: {},
          r2: {},
        },
        run: ({ v }, { r1, r2 }, {}) => {
          r1?.next(v);
          if (isDefined(r2)) {
            r2.next(v);
          }
        },
      };

      it("runs when optional outputs are absent", () => {
        const v = dynamicNodeInput();
        const r1 = new Subject();

        const s = spy();
        r1.subscribe(s);

        execute({
          node: optOutput,
          inputs: { v },
          outputs: { r1 },
          resolvedDeps: testNodesCollection,
        });

        v.subject.next(1);

        equal(s.callCount, 1);

        equal(s.lastCall.args, 1);
      });

      it("runs when optional outputs are passed", () => {
        const v = dynamicNodeInput();
        const r1 = new Subject();
        const r2 = new Subject();

        const s = spy();
        r2.subscribe(s);

        execute({
          node: optOutput,
          inputs: { v },
          outputs: { r1, r2 },
          resolvedDeps: testNodesCollection,
        });

        v.subject.next(17);

        equal(s.callCount, 1);

        equal(s.lastCall.args, 17);
      });
    });
  });

  describe("node as args", () => {
    const isOddPredicate: VisualNode = {
      id: "is-even",
      inputsPosition: {},
      outputsPosition: {},
      inputs: {
        item: {},
        idx: { mode: "optional" },
      },
      outputs: {
        r: {},
      },
      instances: [nodeInstance("a", isEven.id)],
      connections: [
        {
          from: externalConnectionNode("item"),
          to: connectionNode("a", "item"),
        },
        { from: connectionNode("a", "r"), to: externalConnectionNode("r") },
      ],
    };

    it("works with nodes as parameters", () => {
      const s = spy();
      const list = dynamicNodeInput();
      const fn = dynamicNodeInput();
      const r = new Subject();
      r.subscribe(s);
      execute({
        node: filter,
        inputs: { list, fn },
        outputs: { r },
        resolvedDeps: testNodesCollection,
      });
      list.subject.next([1, 2, 3, 4, 5, 6]);
      fn.subject.next(isEven);

      assert.equal(s.called, true);
      assert.deepEqual(s.lastCall.args[0], [2, 4, 6]);
    });

    it("works with visual nodes as parameters", () => {
      const s = spy();
      const list = dynamicNodeInput();
      const fn = dynamicNodeInput();
      const r = new Subject();
      r.subscribe(s);
      execute({
        node: filter,
        inputs: { list, fn },
        outputs: { r },
        resolvedDeps: testNodesCollection,
      });
      list.subject.next([1, 2, 3, 4, 5, 6]);
      fn.subject.next(isOddPredicate);

      assert.equal(s.called, true);
      assert.deepEqual(s.lastCall.args[0], [2, 4, 6]);
    });
  });

  describe("debugger", () => {
    describe("onInput()", () => {
      let clock: any;
      afterEach(() => {
        if (clock) {
          clock.restore();
        }
      });

      it("is called properly inside group", () => {
        const n = dynamicNodeInput();
        const r = dynamicOutput();

        const s = spy();

        const onEvent = wrappedOnEvent(DebuggerEventType.INPUT_CHANGE, s);

        execute({
          node: add1mul2,
          inputs: { n },
          outputs: { r },
          resolvedDeps: testNodesCollection,
          _debugger: { onEvent },
        });

        assert.equal(s.called, false);
        n.subject.next(2);

        assert.equal(s.callCount, 3);

        assert.equal(
          s.calledWithMatch({
            type: DebuggerEventType.INPUT_CHANGE,
            insId: "b",
            ancestorsInsIds: "__root",
            pinId: "n",
            val: 3,
          }),
          true
        );
        assert.equal(
          s.calledWithMatch({
            type: DebuggerEventType.INPUT_CHANGE,
            ancestorsInsIds: "__root",
            insId: "a",
            pinId: "n",
            val: 2,
          }),
          true
        );
        assert.equal(
          s.calledWithMatch({
            type: DebuggerEventType.INPUT_CHANGE,
            insId: "__root",
            pinId: "n",
            val: 2,
          }),
          true
        );
      });

      it("is called for all nodes inside the group", () => {
        const n = dynamicNodeInput();
        const r = dynamicOutput();

        const s = spy();
        const onEvent = wrappedOnEvent(DebuggerEventType.INPUT_CHANGE, s);

        execute({
          node: add1mul2add1,
          inputs: { n },
          outputs: { r },
          resolvedDeps: testNodesCollection,
          _debugger: { onEvent },
        });

        assert.equal(s.called, false);
        n.subject.next(2);

        assert.equal(s.callCount, 4);

        console.log(s.getCalls()[1]?.args[0]);

        assert.equal(
          s.calledWithMatch({
            ancestorsInsIds: "__root",
            insId: "b",
            pinId: "n",
            val: 3,
          }),
          true
        );
        assert.equal(
          s.calledWithMatch({
            ancestorsInsIds: "__root",
            insId: "c",
            pinId: "n",
            val: 6,
          }),
          true
        );
        assert.equal(
          s.calledWithMatch({
            ancestorsInsIds: "__root",
            insId: "a",
            pinId: "n",
            val: 2,
          }),
          true
        );
        assert.equal(
          s.calledWithMatch({
            insId: "__root",
            pinId: "n",
            val: 2,
          }),
          true
        );
      });

      it("group - waits for the promise to be resolved if the command is an intercept cmd", async () => {
        const n = dynamicNodeInput();
        const r = dynamicOutput();

        const s = spy();

        r.subscribe(s);
        execute({
          node: add1mul2add1,
          inputs: { n },
          outputs: { r },
          resolvedDeps: testNodesCollection,
          _debugger: {
            onEvent: ({ val, insId, type }) => {
              if (type === DebuggerEventType.INPUT_CHANGE) {
                return {
                  cmd: "intercept",
                  valuePromise: Promise.resolve(insId ? Number(val) * 2 : val), // intercept only inside
                };
              }
              return undefined;
            },
          },
        });

        n.subject.next(3);

        assert.equal(s.called, false);

        await eventually(() => {
          assert.equal(s.lastCall.args[0], 105); // normal is 9, but we double each of the inputs, so its ((6 + 1) * 2 * 2) * 2 +1
        });
      });

      it("emits input change msgs on main inputs as well - code", () => {
        const n1 = dynamicNodeInput();
        const n2 = dynamicNodeInput();
        const r = new Subject();

        const inputSpy = spy();
        const onEvent = wrappedOnEvent(
          DebuggerEventType.INPUT_CHANGE,
          inputSpy
        );
        execute({
          node: add,
          inputs: { n1, n2 },
          outputs: { r },
          resolvedDeps: testNodesCollection,
          _debugger: { onEvent },
          insId: "myIns",
        });
        n1.subject.next(5);
        n2.subject.next(10);
        assert.equal(inputSpy.callCount, 2);

        assert.equal(
          inputSpy.calledWithMatch({
            insId: "myIns",
            pinId: "n1",
            val: 5,
          }),
          true
        );
        assert.equal(
          inputSpy.calledWithMatch({
            insId: "myIns",
            pinId: "n2",
            val: 10,
          }),
          true
        );
      });

      it("emits input change msgs on main inputs as well - visual", () => {
        const n1 = dynamicNodeInput();
        const n2 = dynamicNodeInput();
        const r = new Subject();

        const inputSpy = spy();
        const onEvent = wrappedOnEvent(
          DebuggerEventType.INPUT_CHANGE,
          inputSpy
        );

        execute({
          node: addGrouped,
          inputs: { n1, n2 },
          outputs: { r },
          resolvedDeps: testNodesCollection,
          _debugger: { onEvent },
          insId: "myIns",
        });
        n1.subject.next(5);
        n2.subject.next(10);

        assert.equal(inputSpy.callCount, 4);
        assert.equal(
          inputSpy.calledWithMatch({ insId: "myIns", pinId: "n1", val: 5 }),
          true
        );
        assert.equal(
          inputSpy.calledWithMatch({ insId: "myIns", pinId: "n2", val: 10 }),
          true
        );
      });

      it("emits input change msgs on static values", () => {
        const n1 = staticNodeInput(25);
        const n2 = dynamicNodeInput();
        const r = new Subject();

        const inputSpy = spy();
        const onEvent = wrappedOnEvent(
          DebuggerEventType.INPUT_CHANGE,
          inputSpy
        );

        execute({
          node: addGrouped,
          inputs: { n1, n2 },
          outputs: { r },
          resolvedDeps: testNodesCollection,
          _debugger: { onEvent },
          insId: "myIns",
        });
        // n1.subject.next(5);
        n2.subject.next(10);

        assert.equal(inputSpy.callCount, 4);
        assert.equal(
          inputSpy.calledWithMatch({ insId: "myIns", pinId: "n1", val: 25 }),
          true
        );
        assert.equal(
          inputSpy.calledWithMatch({ insId: "myIns", pinId: "n2", val: 10 }),
          true
        );
      });

      it("intercepts input value on visual node", async () => {
        const n = dynamicNodeInput();
        const r = dynamicOutput();

        const s = spy();
        r.subscribe(s);
        execute({
          node: add1mul2add1,
          inputs: { n },
          outputs: { r },
          resolvedDeps: testNodesCollection,
          _debugger: {
            onEvent: ({ val, insId, type }) => {
              if (type === DebuggerEventType.INPUT_CHANGE) {
                return {
                  cmd: "intercept",
                  valuePromise: Promise.resolve(insId ? Number(val) * 2 : val), // intercept only inside
                };
              }
              return undefined;
            },
          },
        });

        n.subject.next(3);

        assert.equal(s.called, false); // ensures the promise is waited

        await eventually(() => {
          assert.equal(s.lastCall.args[0], 105); // normal is 9, but we double each of the inputs, so its ((6 + 1) * 2 * 2) * 2 +1
        });
      });

      it("intercepts input value on code node", async () => {
        const n = dynamicNodeInput();
        const r = dynamicOutput();

        const s = spy();
        r.subscribe(s);
        execute({
          node: mul2,
          inputs: { n },
          outputs: { r },
          resolvedDeps: testNodesCollection,
          _debugger: {
            onEvent: ({ val, type }) => {
              if (type !== DebuggerEventType.INPUT_CHANGE) return undefined;
              return {
                cmd: "intercept",
                valuePromise: Promise.resolve(Number(val) * 2), // intercept only inside
              };
            },
          },
        });

        n.subject.next(3);

        // assert.equal(s.called, false); // ensures the promise is waited

        await eventually(() => {
          assert.equal(s.lastCall.args[0], 12); // normal is 6, but we double the input
        });
      });
    });

    describe("onOutput()", () => {
      let clock: any;

      afterEach(() => {
        if (clock) {
          clock.restore();
        }
      });

      it("is called properly inside group", () => {
        const n = dynamicNodeInput();
        const r = dynamicOutput();

        const s = spy();
        const onEvent = wrappedOnEvent(DebuggerEventType.OUTPUT_CHANGE, s);

        execute({
          node: add1mul2,
          inputs: { n },
          outputs: { r },
          resolvedDeps: testNodesCollection,
          _debugger: { onEvent },
          insId: "myIns",
        });

        assert.equal(s.called, false);
        n.subject.next(2);

        assert.equal(s.callCount, 3);

        assert.equal(
          s.calledWithMatch({
            insId: "b",
            pinId: "r",
            val: 6,
          }),
          true
        );
        assert.equal(
          s.calledWithMatch({
            insId: "a",
            pinId: "r",
            val: 3,
          }),
          true
        );
        assert.equal(
          s.calledWithMatch({ insId: "myIns", pinId: "r", val: 6 }),
          true
        );
      });

      it("emits output change msgs on main inputs as well - native", () => {
        const n1 = dynamicNodeInput();
        const n2 = dynamicNodeInput();
        const r = new Subject();

        const onOutput = spy();

        const onEvent = wrappedOnEvent(
          DebuggerEventType.OUTPUT_CHANGE,
          onOutput
        );

        execute({
          node: add,
          inputs: { n1, n2 },
          outputs: { r },
          resolvedDeps: testNodesCollection,
          _debugger: { onEvent },
          insId: "myIns",
        });
        n1.subject.next(5);
        n2.subject.next(10);
        assert.equal(onOutput.callCount, 1);

        const lastCallArg = onOutput.lastCall.args[0];
        assert.equal(lastCallArg.insId, "myIns");
        assert.equal(lastCallArg.pinId, "r");
        assert.equal(lastCallArg.val, "15");

        assert.equal(onOutput.callCount, 1);
      });

      it("emits output change msgs on main output as well - visual", () => {
        const n1 = dynamicNodeInput();
        const n2 = dynamicNodeInput();
        const r = new Subject();

        const onOutput = spy();
        const onEvent = wrappedOnEvent(
          DebuggerEventType.OUTPUT_CHANGE,
          onOutput
        );

        execute({
          node: addGrouped,
          inputs: { n1, n2 },
          outputs: { r },
          resolvedDeps: testNodesCollection,
          _debugger: { onEvent },
          insId: "myIns",
        });
        n1.subject.next(5);
        n2.subject.next(10);

        const lastCallArg = onOutput.lastCall.args[0];

        assert.equal(onOutput.callCount, 2);
        assert.equal(lastCallArg.pinId, "r");
        assert.equal(lastCallArg.val, 15);
        assert.equal(lastCallArg.insId, "myIns");
        assert.equal(lastCallArg.ancestorsInsIds, undefined);
      });

      it("intercepts returned value", async () => {
        const n = dynamicNodeInput();
        const r = dynamicOutput();

        const s = spy();
        r.subscribe(s);
        execute({
          node: add1mul2add1,
          inputs: { n },
          outputs: { r },
          resolvedDeps: testNodesCollection,
          _debugger: {
            onEvent: ({ val, type }) => {
              if (type !== DebuggerEventType.OUTPUT_CHANGE) return undefined;
              // return undefined;
              const newVal = Number(val) * 2;
              return {
                cmd: "intercept",
                valuePromise: Promise.resolve(newVal), // intercept only inside
              };
            },
          },
        });

        n.subject.next(3);

        assert.equal(s.called, false);

        await eventually(() => {
          assert.equal(s.lastCall.args[0], 132); // normal is 9, but we double each of the inputs, so its alot more
        });
      });
    });

    describe("processing event", () => {
      it("notifies when node starts processing", async () => {
        const [item] = dynamicNodeInputs(1) as [DynamicNodeInput];
        const r = dynamicOutput();

        const onProcessing = spy();
        const onEvent = wrappedOnEvent(
          DebuggerEventType.PROCESSING_CHANGE,
          onProcessing
        );

        const delay = conciseCodeNode({
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
        execute({
          node: delay,
          inputs: { item },
          outputs: { r },
          resolvedDeps: testNodesCollection,
          _debugger: {
            onEvent,
          },
        });

        assert.equal(onProcessing.called, false);
        item.subject.next(3);

        assert.equal(onProcessing.called, true);
        assert.equal(onProcessing.lastCall.args[0].val, true);
        assert.equal(onProcessing.lastCall.args[0].insId, "__root");
        assert.equal(onProcessing.lastCall.args[0].nodeId, "delay5");
      });

      it("notifies when node ends processing", async () => {
        const [item] = dynamicNodeInputs(1) as [DynamicNodeInput];
        const r = dynamicOutput();

        const onProcessing = spy();
        const onEvent = wrappedOnEvent(
          DebuggerEventType.PROCESSING_CHANGE,
          onProcessing
        );

        execute({
          node: delay5,
          inputs: { item },
          outputs: { r },
          resolvedDeps: testNodesCollection,
          _debugger: {
            onEvent,
          },
        });

        item.subject.next("bobs");

        return eventually(() => {
          assert.equal(onProcessing.lastCall.args[0].val, false);
          assert.equal(onProcessing.lastCall.args[0].nodeId, "delay5");
          assert.equal(onProcessing.callCount, 2);
        }, 200);
      });

      it("notifies with state count when inputs state is changed", async () => {
        const [item] = dynamicNodeInputs(1) as [DynamicNodeInput];
        const r = dynamicOutput();

        const onInputsStateChange = spy();

        const onEvent = wrappedOnEvent(
          DebuggerEventType.INPUTS_STATE_CHANGE,
          onInputsStateChange
        );

        execute({
          node: delay5,
          inputs: { item },
          outputs: { r },
          resolvedDeps: testNodesCollection,
          _debugger: {
            onEvent,
          },
        });

        item.subject.next("a");
        item.subject.next("b");

        assert.equal(onInputsStateChange.callCount, 3);

        assert.equal(onInputsStateChange.lastCall.args[0].val.item, 1);
        assert.equal(onInputsStateChange.lastCall.args[0].nodeId, "delay5");

        item.subject.next("c");
        assert.equal(onInputsStateChange.lastCall.args[0].val.item, 2);

        await eventually(() => {
          assert.equal(onInputsStateChange.lastCall.args[0].val.item, 0);
        }, 200);
      });

      it("notifies with state count when inputs state is changed on sticky inputs", async () => {
        const [item, ms] = dynamicNodeInputs(2) as [
          DynamicNodeInput,
          DynamicNodeInput
        ];
        const r = dynamicOutput();

        ms.config = stickyInputPinConfig();

        const onEventSpy = spy();

        const onEvent = wrappedOnEvent(
          DebuggerEventType.INPUTS_STATE_CHANGE,
          onEventSpy
        );

        execute({
          node: delay,
          inputs: { item, ms },
          outputs: { r },
          resolvedDeps: testNodesCollection,
          _debugger: {
            onEvent,
          },
        });

        ms.subject.next(2);
        assert.equal(onEventSpy.lastCall.args[0].val.ms, 1);

        item.subject.next("a");
        assert.equal(onEventSpy.lastCall.args[0].val.ms, 1);

        item.subject.next("c");
        assert.equal(onEventSpy.lastCall.args[0].val.ms, 1);

        await eventually(() => {
          assert.equal(onEventSpy.lastCall.args[0].val.item, 0);
          assert.equal(onEventSpy.lastCall.args[0].val.ms, 1);
        }, 200);
      });
    });
  });
});
