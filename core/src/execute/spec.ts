import {
  CodeNode,
  VisualNode,
  partInput,
  partOutput,
  Part,
  dynamicOutput,
  dynamicPartInput,
  partInstance,
  dynamicPartInputs,
  stickyInputPinConfig,
  staticPartInput,
  DynamicPartInput,
} from "../part";
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
  testPartsCollection,
  testPartsCollectionWith,
  delay,
  delay5,
} from "../fixture";

import { conciseCodePart, wrappedOnEvent } from "../test-utils";
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
      n1: partInput(),
      n2: partInput("optional"),
    },
    outputs: {
      r: partOutput(),
    },
    inputsPosition: {},
    outputsPosition: {},
    instances: [partInstance("a", optAdd.id)],
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

  describe("visual parts", () => {
    it("works with a single piece inside", () => {
      const n1 = dynamicPartInput();
      const n2 = dynamicPartInput();
      const r = new Subject();
      const s = spy();
      r.subscribe(s);
      execute({
        part: addGrouped,
        inputs: { n1, n2 },
        outputs: { r },
        resolvedDeps: testPartsCollection,
      });
      const num1 = randomInt(1, 100);
      const num2 = randomInt(1, 100);
      n1.subject.next(num1);
      n2.subject.next(num2);
      assert.equal(s.callCount, 1);
      assert.equal(s.lastCall.args[0], num1 + num2);
    });

    it("connects two pieces together properly", () => {
      const n = dynamicPartInput();
      const r = new Subject();
      const s = spy();
      r.subscribe(s);
      execute({
        part: add1mul2,
        inputs: { n },
        outputs: { r },
        resolvedDeps: testPartsCollection,
      });
      const num = randomInt(1, 100);
      n.subject.next(num);
      assert.equal(s.callCount, 1);
      assert.equal(s.lastCall.args[0], (num + 1) * 2);
    });

    it("compiles visual parts with the right inputs and outputs", () => {
      const visualPart: VisualNode = {
        id: "apart",
        inputs: { a: partInput(), b: partInput() },
        outputs: { r: partOutput() },
        instances: [],
        connections: [],
        inputsPosition: {},
        outputsPosition: {},
      };

      const part = connect(visualPart, testPartsCollection, {} as any);
      assert.deepEqual(keys(part.outputs), keys(visualPart.outputs));
      assert.deepEqual(keys(part.inputs), keys(visualPart.inputs));
    });

    it("compiles visual parts with the right inputs and outputs when inputs have modes", () => {
      const visualPart: VisualNode = {
        id: "apart",
        inputs: {
          a: partInput("optional"),
          b: partInput("required"),
        },
        outputs: { r: partOutput() },
        instances: [],
        connections: [],
        inputsPosition: {},
        outputsPosition: {},
      };

      const part = connect(visualPart, testPartsCollection, {} as any);
      assert.equal(part.inputs["a"]?.mode, "optional");
      assert.equal(part.inputs["b"]?.mode, "required");
    });
  });

  describe("optional", () => {
    describe("inputs", () => {
      it("runs when optional inputs are absent", () => {
        const n1 = dynamicPartInput();
        const r = new Subject();

        const s = spy();
        r.subscribe(s);

        execute({
          part: optAdd,
          inputs: { n1 },
          outputs: { r },
          resolvedDeps: testPartsCollection,
        });

        n1.subject.next(1);

        equal(s.callCount, 1);

        equal(s.lastCall.args, 43);
      });

      it("runs considers optional types that are given before mandatory", () => {
        const n1 = dynamicPartInput();
        const n2 = dynamicPartInput();
        const r = new Subject();

        const s = spy();
        r.subscribe(s);

        execute({
          part: optAdd,
          inputs: { n1, n2 },
          outputs: { r },
          resolvedDeps: testPartsCollection,
        });

        n2.subject.next(3);
        n1.subject.next(1);

        equal(s.callCount, 1);

        equal(s.lastCall.args, 4);
      });

      it("runs considers optional types that are given after mandatory", () => {
        const n1 = dynamicPartInput();
        const n2 = dynamicPartInput();
        const r = new Subject();

        const s = spy();
        r.subscribe(s);

        execute({
          part: optAdd,
          inputs: { n1, n2 },
          outputs: { r },
          resolvedDeps: testPartsCollection,
        });

        n1.subject.next(1);
        n2.subject.next(3);

        equal(s.callCount, 1);

        equal(s.lastCall.args, 4);
      });

      it("runs when optional inputs are absent- visual opt input", () => {
        const n1 = dynamicPartInput();
        const r = new Subject();

        const s = spy();
        r.subscribe(s);

        execute({
          part: groupedOptInput,
          inputs: { n1 },
          outputs: { r },
          resolvedDeps: testPartsCollection,
        });

        n1.subject.next(1);

        equal(s.callCount, 1);

        equal(s.lastCall.args, 43);
      });

      it.skip("works properly when optional input is given after mandatory", () => {
        const n1 = dynamicPartInput();
        const n2 = dynamicPartInput();
        const r = new Subject();

        const s = spy();
        r.subscribe(s);

        execute({
          part: groupedOptInput,
          inputs: { n1, n2 },
          outputs: { r },
          resolvedDeps: testPartsCollection,
        });

        n1.subject.next(3);
        n2.subject.next(1);

        equal(s.callCount, 2);
        equal(s.lastCall.args, 4);
      });

      it("waits for inputs given when all are given", () => {
        const n1 = dynamicPartInput();
        const n2 = dynamicPartInput();
        const r = new Subject();

        const s = spy();
        r.subscribe(s);

        execute({
          part: totalOptInput,
          inputs: { n1, n2 },
          outputs: { r },
          resolvedDeps: testPartsCollection,
        });

        n1.subject.next(3);
        n2.subject.next(1);

        equal(s.callCount, 1);
        equal(s.lastCall.args, 4);
      });

      it("waits for inputs given when some are given", () => {
        const n1 = dynamicPartInput();
        const r = new Subject();

        const s = spy();
        r.subscribe(s);

        execute({
          part: totalOptInput,
          inputs: { n1 },
          outputs: { r },
          resolvedDeps: testPartsCollection,
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
          part: totalOptInput,
          inputs: {},
          outputs: { r },
          resolvedDeps: testPartsCollection,
        });

        equal(s.callCount, 1);
        equal(s.lastCall.args, 84);
      });

      it("runs properly when outer optional inputs are passed that are not connected internally (like list map)", () => {
        const r = new Subject();

        const s = spy();
        r.subscribe(s);

        const part: VisualNode = {
          id: "bob",
          inputsPosition: {},
          outputsPosition: {},
          inputs: {
            a: partInput(),
            b: partInput("optional"),
          },
          outputs: {
            r: partOutput(),
          },
          instances: [
            partInstance("a", id.id),
            // partInstance('b', id),
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

        const a = dynamicPartInput();
        const b = dynamicPartInput();

        execute({
          part: part,
          inputs: { a, b },
          outputs: { r },
          resolvedDeps: testPartsCollection,
        });

        a.subject.next(42);
        b.subject.next(1);
        assert.equal(s.callCount, 1);
        assert.equal(s.lastCall.args[0], 42);
      });

      it("runs properly when given an unconnected visual optional part", () => {
        const r = new Subject();

        const s = spy();
        r.subscribe(s);

        const val2 = Value(2);
        const resolvedDeps = testPartsCollectionWith(val2);

        const part: VisualNode = {
          id: "bob",
          inputsPosition: {},
          outputsPosition: {},
          inputs: {
            a: partInput("optional"),
          },
          outputs: {
            r: partOutput(),
          },
          instances: [partInstance("v", Value(2).id), partInstance("a", id.id)],
          connections: [
            connectionData(["a", "r"], ["r"]),
            connectionData(["v", "r"], ["a", "v"]),
          ],
        };

        execute({
          part: part,
          inputs: {},
          outputs: { r },
          resolvedDeps: resolvedDeps,
        });

        assert.equal(s.callCount, 1);
        assert.equal(s.lastCall.args[0], 2);
      });
    });

    describe("outputs", () => {
      const optOutput: Part = {
        id: "dup",
        inputs: {
          v: partInput(),
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
        const v = dynamicPartInput();
        const r1 = new Subject();

        const s = spy();
        r1.subscribe(s);

        execute({
          part: optOutput,
          inputs: { v },
          outputs: { r1 },
          resolvedDeps: testPartsCollection,
        });

        v.subject.next(1);

        equal(s.callCount, 1);

        equal(s.lastCall.args, 1);
      });

      it("runs when optional outputs are passed", () => {
        const v = dynamicPartInput();
        const r1 = new Subject();
        const r2 = new Subject();

        const s = spy();
        r2.subscribe(s);

        execute({
          part: optOutput,
          inputs: { v },
          outputs: { r1, r2 },
          resolvedDeps: testPartsCollection,
        });

        v.subject.next(17);

        equal(s.callCount, 1);

        equal(s.lastCall.args, 17);
      });
    });
  });

  describe("part as args", () => {
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
      instances: [partInstance("a", isEven.id)],
      connections: [
        {
          from: externalConnectionNode("item"),
          to: connectionNode("a", "item"),
        },
        { from: connectionNode("a", "r"), to: externalConnectionNode("r") },
      ],
    };

    it("works with components as parameters", () => {
      const s = spy();
      const list = dynamicPartInput();
      const fn = dynamicPartInput();
      const r = new Subject();
      r.subscribe(s);
      execute({
        part: filter,
        inputs: { list, fn },
        outputs: { r },
        resolvedDeps: testPartsCollection,
      });
      list.subject.next([1, 2, 3, 4, 5, 6]);
      fn.subject.next(isEven);

      assert.equal(s.called, true);
      assert.deepEqual(s.lastCall.args[0], [2, 4, 6]);
    });

    it("works with visual components as parameters", () => {
      const s = spy();
      const list = dynamicPartInput();
      const fn = dynamicPartInput();
      const r = new Subject();
      r.subscribe(s);
      execute({
        part: filter,
        inputs: { list, fn },
        outputs: { r },
        resolvedDeps: testPartsCollection,
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
        const n = dynamicPartInput();
        const r = dynamicOutput();

        const s = spy();

        const onEvent = wrappedOnEvent(DebuggerEventType.INPUT_CHANGE, s);

        execute({
          part: add1mul2,
          inputs: { n },
          outputs: { r },
          resolvedDeps: testPartsCollection,
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

      it("is called for all parts inside the group", () => {
        const n = dynamicPartInput();
        const r = dynamicOutput();

        const s = spy();
        const onEvent = wrappedOnEvent(DebuggerEventType.INPUT_CHANGE, s);

        execute({
          part: add1mul2add1,
          inputs: { n },
          outputs: { r },
          resolvedDeps: testPartsCollection,
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
        const n = dynamicPartInput();
        const r = dynamicOutput();

        const s = spy();

        r.subscribe(s);
        execute({
          part: add1mul2add1,
          inputs: { n },
          outputs: { r },
          resolvedDeps: testPartsCollection,
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
        const n1 = dynamicPartInput();
        const n2 = dynamicPartInput();
        const r = new Subject();

        const inputSpy = spy();
        const onEvent = wrappedOnEvent(
          DebuggerEventType.INPUT_CHANGE,
          inputSpy
        );
        execute({
          part: add,
          inputs: { n1, n2 },
          outputs: { r },
          resolvedDeps: testPartsCollection,
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
        const n1 = dynamicPartInput();
        const n2 = dynamicPartInput();
        const r = new Subject();

        const inputSpy = spy();
        const onEvent = wrappedOnEvent(
          DebuggerEventType.INPUT_CHANGE,
          inputSpy
        );

        execute({
          part: addGrouped,
          inputs: { n1, n2 },
          outputs: { r },
          resolvedDeps: testPartsCollection,
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
        const n1 = staticPartInput(25);
        const n2 = dynamicPartInput();
        const r = new Subject();

        const inputSpy = spy();
        const onEvent = wrappedOnEvent(
          DebuggerEventType.INPUT_CHANGE,
          inputSpy
        );

        execute({
          part: addGrouped,
          inputs: { n1, n2 },
          outputs: { r },
          resolvedDeps: testPartsCollection,
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

      it("intercepts input value on visual part", async () => {
        const n = dynamicPartInput();
        const r = dynamicOutput();

        const s = spy();
        r.subscribe(s);
        execute({
          part: add1mul2add1,
          inputs: { n },
          outputs: { r },
          resolvedDeps: testPartsCollection,
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

      it("intercepts input value on code part", async () => {
        const n = dynamicPartInput();
        const r = dynamicOutput();

        const s = spy();
        r.subscribe(s);
        execute({
          part: mul2,
          inputs: { n },
          outputs: { r },
          resolvedDeps: testPartsCollection,
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
        const n = dynamicPartInput();
        const r = dynamicOutput();

        const s = spy();
        const onEvent = wrappedOnEvent(DebuggerEventType.OUTPUT_CHANGE, s);

        execute({
          part: add1mul2,
          inputs: { n },
          outputs: { r },
          resolvedDeps: testPartsCollection,
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
        const n1 = dynamicPartInput();
        const n2 = dynamicPartInput();
        const r = new Subject();

        const onOutput = spy();

        const onEvent = wrappedOnEvent(
          DebuggerEventType.OUTPUT_CHANGE,
          onOutput
        );

        execute({
          part: add,
          inputs: { n1, n2 },
          outputs: { r },
          resolvedDeps: testPartsCollection,
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
        const n1 = dynamicPartInput();
        const n2 = dynamicPartInput();
        const r = new Subject();

        const onOutput = spy();
        const onEvent = wrappedOnEvent(
          DebuggerEventType.OUTPUT_CHANGE,
          onOutput
        );

        execute({
          part: addGrouped,
          inputs: { n1, n2 },
          outputs: { r },
          resolvedDeps: testPartsCollection,
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
        const n = dynamicPartInput();
        const r = dynamicOutput();

        const s = spy();
        r.subscribe(s);
        execute({
          part: add1mul2add1,
          inputs: { n },
          outputs: { r },
          resolvedDeps: testPartsCollection,
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
      it("notifies when part starts processing", async () => {
        const [item] = dynamicPartInputs(1) as [DynamicPartInput];
        const r = dynamicOutput();

        const onProcessing = spy();
        const onEvent = wrappedOnEvent(
          DebuggerEventType.PROCESSING_CHANGE,
          onProcessing
        );

        const delay = conciseCodePart({
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
          part: delay,
          inputs: { item },
          outputs: { r },
          resolvedDeps: testPartsCollection,
          _debugger: {
            onEvent,
          },
        });

        assert.equal(onProcessing.called, false);
        item.subject.next(3);

        assert.equal(onProcessing.called, true);
        assert.equal(onProcessing.lastCall.args[0].val, true);
        assert.equal(onProcessing.lastCall.args[0].insId, "__root");
        assert.equal(onProcessing.lastCall.args[0].partId, "delay5");
      });

      it("notifies when part ends processing", async () => {
        const [item] = dynamicPartInputs(1) as [DynamicPartInput];
        const r = dynamicOutput();

        const onProcessing = spy();
        const onEvent = wrappedOnEvent(
          DebuggerEventType.PROCESSING_CHANGE,
          onProcessing
        );

        execute({
          part: delay5,
          inputs: { item },
          outputs: { r },
          resolvedDeps: testPartsCollection,
          _debugger: {
            onEvent,
          },
        });

        item.subject.next("bobs");

        return eventually(() => {
          assert.equal(onProcessing.lastCall.args[0].val, false);
          assert.equal(onProcessing.lastCall.args[0].partId, "delay5");
          assert.equal(onProcessing.callCount, 2);
        }, 200);
      });

      it("notifies with state count when inputs state is changed", async () => {
        const [item] = dynamicPartInputs(1) as [DynamicPartInput];
        const r = dynamicOutput();

        const onInputsStateChange = spy();

        const onEvent = wrappedOnEvent(
          DebuggerEventType.INPUTS_STATE_CHANGE,
          onInputsStateChange
        );

        execute({
          part: delay5,
          inputs: { item },
          outputs: { r },
          resolvedDeps: testPartsCollection,
          _debugger: {
            onEvent,
          },
        });

        item.subject.next("a");
        item.subject.next("b");

        assert.equal(onInputsStateChange.callCount, 3);

        assert.equal(onInputsStateChange.lastCall.args[0].val.item, 1);
        assert.equal(onInputsStateChange.lastCall.args[0].partId, "delay5");

        item.subject.next("c");
        assert.equal(onInputsStateChange.lastCall.args[0].val.item, 2);

        await eventually(() => {
          assert.equal(onInputsStateChange.lastCall.args[0].val.item, 0);
        }, 200);
      });

      it("notifies with state count when inputs state is changed on sticky inputs", async () => {
        const [item, ms] = dynamicPartInputs(2) as [
          DynamicPartInput,
          DynamicPartInput
        ];
        const r = dynamicOutput();

        ms.config = stickyInputPinConfig();

        const onEventSpy = spy();

        const onEvent = wrappedOnEvent(
          DebuggerEventType.INPUTS_STATE_CHANGE,
          onEventSpy
        );

        execute({
          part: delay,
          inputs: { item, ms },
          outputs: { r },
          resolvedDeps: testPartsCollection,
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
