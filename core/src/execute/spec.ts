import {
  NativePart,
  GroupedPart,
  partInput,
  partOutput,
  Part,
  dynamicOutput,
  dynamicPartInput,
  partInstance,
  dynamicPartInputs,
  stickyInputPinConfig,
} from "../part";
import { execute } from ".";
import { Subject } from "rxjs";
import { spy, useFakeTimers } from "sinon";
import { assert } from "chai";
import { connectionNode, externalConnectionNode, connectionData, connect } from "../connect";
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
  testRepo,
  testRepoWith,
  delay,
  delay5,
} from "../fixture";

import { conciseNativePart } from "../test-utils";

describe("execute", () => {
  const totalOptInput: NativePart = {
    id: "optAdd",
    inputs: {
      n1: { type: "number", mode: "required-if-connected" },
      n2: { type: "number", mode: "required-if-connected" },
    },
    outputs: {
      r: { type: "number" },
    },
    fn: ({ n1, n2 }, { r }, {}) => {
      const a = isDefined(n1) ? n1 : 42;
      const b = isDefined(n2) ? n2 : 42;
      r.next(a + b);
    },
  };

  const groupedOptInput: GroupedPart = {
    id: "groupedOptAdd",
    inputs: {
      n1: partInput("number"),
      n2: partInput("number", "optional"),
    },
    outputs: {
      r: partOutput("number"),
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

  const addGrouped: GroupedPart = {
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

  describe("grouped parts", () => {
    it("works with a single piece inside", () => {
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

    it("connects two pieces together properly", () => {
      const n = dynamicPartInput();
      const r = new Subject();
      const s = spy();
      r.subscribe(s);
      execute({part: add1mul2, inputs: { n }, outputs: { r }, partsRepo: testRepo});
      const num = randomInt(1, 100);
      n.subject.next(num);
      assert.equal(s.callCount, 1);
      assert.equal(s.lastCall.args[0], (num + 1) * 2);
    });

    it("compiles grouped parts with the right inputs and outputs", () => {
      const groupedPart: GroupedPart = {
        id: "apart",
        inputs: { a: partInput(), b: partInput() },
        outputs: { r: partOutput() },
        instances: [],
        connections: [],
        inputsPosition: {},
        outputsPosition: {},
      };

      const part = connect(groupedPart, testRepo, {} as any);
      assert.deepEqual(keys(part.outputs), keys(groupedPart.outputs));
      assert.deepEqual(keys(part.inputs), keys(groupedPart.inputs));
    });

    it("compiles grouped parts with the right inputs and outputs when inputs have modes", () => {
      const groupedPart: GroupedPart = {
        id: "apart",
        inputs: { a: partInput("bob", "optional"), b: partInput("bob2", "required") },
        outputs: { r: partOutput() },
        instances: [],
        connections: [],
        inputsPosition: {},
        outputsPosition: {},
      };

      const part = connect(groupedPart, testRepo, {} as any);
      assert.equal(part.inputs["a"].mode, "optional");
      assert.equal(part.inputs["b"].mode, "required");
    });
  });

  describe("optional", () => {
    describe("inputs", () => {
      it("runs when optional inputs are absent", () => {
        const n1 = dynamicPartInput();
        const r = new Subject();

        const s = spy();
        r.subscribe(s);

        execute({part: optAdd, inputs: { n1 }, outputs: { r }, partsRepo: testRepo});

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

        execute({part: optAdd, inputs: { n1, n2 }, outputs: { r }, partsRepo: testRepo});

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

        execute({part: optAdd, inputs: { n1, n2 }, outputs: { r }, partsRepo: testRepo});

        n1.subject.next(1);
        n2.subject.next(3);

        equal(s.callCount, 1);

        equal(s.lastCall.args, 4);
      });

      it("runs when optional inputs are absent- grouped opt input", () => {
        const n1 = dynamicPartInput();
        const r = new Subject();

        const s = spy();
        r.subscribe(s);

        execute({part: groupedOptInput, inputs: { n1 }, outputs: { r }, partsRepo: testRepo});

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

        execute({part: groupedOptInput, inputs: { n1, n2 }, outputs: { r }, partsRepo: testRepo});

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

        execute({part: totalOptInput, inputs: { n1, n2 }, outputs: { r }, partsRepo: testRepo});

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

        execute({part: totalOptInput, inputs: { n1 }, outputs: { r }, partsRepo: testRepo});

        n1.subject.next(3);

        equal(s.callCount, 1);
        equal(s.lastCall.args, 45);
      });

      it("runs if no inputs are given and they are all optional", () => {
        const r = new Subject();

        const s = spy();
        r.subscribe(s);

        execute({part: totalOptInput, inputs: {}, outputs: { r }, partsRepo: testRepo});

        equal(s.callCount, 1);
        equal(s.lastCall.args, 84);
      });

      it("runs properly when outer optional inputs are passed that are not connected internally (like list map)", () => {
        const r = new Subject();

        const s = spy();
        r.subscribe(s);

        const part: GroupedPart = {
          id: "bob",
          inputsPosition: {},
          outputsPosition: {},
          inputs: {
            a: partInput("number"),
            b: partInput("number", "optional"),
          },
          outputs: {
            r: partOutput("number"),
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

        execute({part: part, inputs: { a, b }, outputs: { r }, partsRepo: testRepo});

        a.subject.next(42);
        b.subject.next(1);
        assert.equal(s.callCount, 1);
        assert.equal(s.lastCall.args[0], 42);
      });

      it("runs properly when given an unconnected grouped optional part", () => {
        const r = new Subject();

        const s = spy();
        r.subscribe(s);

        const val2 = Value(2);
        const repo = testRepoWith(val2);

        const part: GroupedPart = {
          id: "bob",
          inputsPosition: {},
          outputsPosition: {},
          inputs: {
            a: partInput("number", "optional"),
          },
          outputs: {
            r: partOutput("number"),
          },
          instances: [partInstance("v", Value(2).id), partInstance("a", id.id)],
          connections: [connectionData(["a", "r"], ["r"]), connectionData(["v", "r"], ["a", "v"])],
        };

        execute({part: part, inputs: {}, outputs: { r }, partsRepo: repo});

        assert.equal(s.callCount, 1);
        assert.equal(s.lastCall.args[0], 2);
      });
    });

    describe("outputs", () => {
      const optOutput: Part = {
        id: "dup",
        inputs: {
          v: partInput("any"),
        },
        outputs: {
          r1: { type: "number" },
          r2: { type: "number" },
        },
        fn: ({ v }, { r1, r2 }, {}) => {
          r1.next(v);
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

        execute({part: optOutput, inputs: { v }, outputs: { r1 }, partsRepo: testRepo});

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

        execute({part: optOutput, inputs: { v }, outputs: { r1, r2 }, partsRepo: testRepo});

        v.subject.next(17);

        equal(s.callCount, 1);

        equal(s.lastCall.args, 17);
      });
    });
  });

  describe("part as args", () => {
    const isOddPredicate: GroupedPart = {
      id: "is-even",
      inputsPosition: {},
      outputsPosition: {},
      inputs: {
        item: { type: "any" },
        idx: { type: "number", mode: "optional" },
      },
      outputs: {
        r: { type: "boolean" },
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
      execute({part: filter, inputs: { list, fn }, outputs: { r }, partsRepo: testRepo});
      list.subject.next([1, 2, 3, 4, 5, 6]);
      fn.subject.next(isEven);

      assert.equal(s.called, true);
      assert.deepEqual(s.lastCall.args[0], [2, 4, 6]);
    });

    it("works with grouped components as parameters", () => {
      const s = spy();
      const list = dynamicPartInput();
      const fn = dynamicPartInput();
      const r = new Subject();
      r.subscribe(s);
      execute({part: filter, inputs: { list, fn }, outputs: { r }, partsRepo: testRepo});
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

        clock = useFakeTimers(10);
        execute({part: add1mul2, inputs: { n }, outputs: { r }, partsRepo: testRepo, _debugger: { onInput: s }});

        assert.equal(s.called, false);
        n.subject.next(2);

        assert.equal(s.callCount, 3);
        assert.equal(
          s.calledWithMatch({ insId: "root.a1m2.b", pinId: "n", val: 3, time: 10 }),
          true
        );
        assert.equal(
          s.calledWithMatch({ insId: "root.a1m2.a", pinId: "n", val: 2, time: 10 }),
          true
        );
        assert.equal(s.calledWithMatch({ insId: "root.a1m2", pinId: "n", val: 2 }), true);
      });

      it("is called for all parts inside the group", () => {
        clock = useFakeTimers(10);
        const n = dynamicPartInput();
        const r = dynamicOutput();

        const s = spy();
        execute({part: add1mul2add1, inputs: { n }, outputs: { r }, partsRepo: testRepo,  _debugger: { onInput: s }});

        assert.equal(s.called, false);
        n.subject.next(2);

        assert.equal(s.callCount, 4);

        assert.equal(
          s.calledWithMatch({ insId: "root.a1m2a1.b", pinId: "n", val: 3, time: 10 }),
          true
        );
        assert.equal(
          s.calledWithMatch({ insId: "root.a1m2a1.c", pinId: "n", val: 6, time: 10 }),
          true
        );
        assert.equal(
          s.calledWithMatch({ insId: "root.a1m2a1.a", pinId: "n", val: 2, time: 10 }),
          true
        );
        assert.equal(s.calledWithMatch({ insId: "root.a1m2a1", pinId: "n", val: 2 }), true);
      });

      it("group - waits for the promise to be resolved if the command is an intercept cmd", async () => {
        const n = dynamicPartInput();
        const r = dynamicOutput();

        const s = spy();
        r.subscribe(s);
        execute({part: add1mul2add1, inputs: { n }, outputs: { r }, partsRepo: testRepo, _debugger: {
          onInput: ({ val, insId }) => {
            // return undefined;
            return {
              cmd: "intercept",
              valuePromise: Promise.resolve(insId ? val * 2 : val), // intercept only inside
            };
          },
        }});

        n.subject.next(3);

        assert.equal(s.called, false);

        await eventually(() => {
          assert.equal(s.lastCall.args[0], 105); // normal is 9, but we double each of the inputs, so its ((6 + 1) * 2 * 2) * 2 +1
        });
      });

      it("emits input change msgs on main inputs as well - native", () => {
        const n1 = dynamicPartInput();
        const n2 = dynamicPartInput();
        const r = new Subject();

        const inputSpy = spy();

        execute({part: add, inputs: { n1, n2 }, outputs: { r }, partsRepo: testRepo, _debugger: { onInput: inputSpy }, insId: "myIns"});
        n1.subject.next(5);
        n2.subject.next(10);
        assert.equal(inputSpy.callCount, 2);
        assert.equal(inputSpy.calledWithMatch({ insId: "root.myIns", pinId: "n1", val: 5 }), true);
        assert.equal(inputSpy.calledWithMatch({ insId: "root.myIns", pinId: "n2", val: 10 }), true);
      });

      it("emits input change msgs on main inputs as well - grouped", () => {
        const n1 = dynamicPartInput();
        const n2 = dynamicPartInput();
        const r = new Subject();

        const inputSpy = spy();

        execute({part: addGrouped, inputs: { n1, n2 }, outputs: { r }, partsRepo: testRepo, _debugger: { onInput: inputSpy }, insId: "myIns"});
        n1.subject.next(5);
        n2.subject.next(10);

        assert.equal(inputSpy.callCount, 4);
        assert.equal(inputSpy.calledWithMatch({ insId: "root.myIns", pinId: "n1", val: 5 }), true);
        assert.equal(inputSpy.calledWithMatch({ insId: "root.myIns", pinId: "n2", val: 10 }), true);
      });

      it("intercepts input value on grouped part", async () => {
        const n = dynamicPartInput();
        const r = dynamicOutput();

        const s = spy();
        r.subscribe(s);
        execute({part: add1mul2add1, inputs: { n }, outputs: { r }, partsRepo: testRepo, _debugger: {
          onInput: ({ val, insId }) => {
            return {
              cmd: "intercept",
              valuePromise: Promise.resolve(insId ? val * 2 : val), // intercept only inside
            };
          },
        }});

        n.subject.next(3);

        assert.equal(s.called, false); // ensures the promise is waited

        await eventually(() => {
          assert.equal(s.lastCall.args[0], 105); // normal is 9, but we double each of the inputs, so its ((6 + 1) * 2 * 2) * 2 +1
        });
      });

      it("intercepts input value on native part", async () => {
        const n = dynamicPartInput();
        const r = dynamicOutput();

        const s = spy();
        r.subscribe(s);
        execute({part: mul2, inputs: { n }, outputs: { r }, partsRepo: testRepo, _debugger: {
          onInput: ({ val }) => {
            return {
              cmd: "intercept",
              valuePromise: Promise.resolve(val * 2), // intercept only inside
            };
          },
        }});

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
        clock = useFakeTimers(10);
        const n = dynamicPartInput();
        const r = dynamicOutput();

        const s = spy();

        execute({part: add1mul2, inputs: { n }, outputs: { r }, partsRepo: testRepo, _debugger: { onOutput: s }, insId: "myIns"});

        assert.equal(s.called, false);
        n.subject.next(2);

        assert.equal(s.callCount, 3);

        assert.equal(
          s.calledWithMatch({
            insId: "root.myIns.b",
            pinId: "r",
            val: 6,
            time: 10,
            partId: "mul2",
          }),
          true
        );
        assert.equal(
          s.calledWithMatch({
            insId: "root.myIns.a",
            pinId: "r",
            val: 3,
            time: 10,
            partId: "add1",
          }),
          true
        );
        assert.equal(
          s.calledWithMatch({ insId: "root.myIns", pinId: "r", val: 6, partId: "a1m2", time: 10 }),
          true
        );
      });

      it("emits output change msgs on main inputs as well - native", () => {
        const n1 = dynamicPartInput();
        const n2 = dynamicPartInput();
        const r = new Subject();

        const onOutput = spy();

        execute({part: add, inputs: { n1, n2 }, outputs: { r }, partsRepo: testRepo, _debugger: { onOutput }, insId: "myIns"});
        n1.subject.next(5);
        n2.subject.next(10);
        assert.equal(onOutput.callCount, 1);

        const lastCallArg = onOutput.lastCall.args[0];
        assert.equal(lastCallArg.insId, "root.myIns");
        assert.equal(lastCallArg.pinId, "r");
        assert.equal(lastCallArg.val, "15");

        assert.equal(onOutput.callCount, 1);
      });

      it("emits output change msgs on main output as well - grouped", () => {
        const n1 = dynamicPartInput();
        const n2 = dynamicPartInput();
        const r = new Subject();

        const onOutput = spy();

        execute({part: addGrouped, inputs: { n1, n2 }, outputs: { r }, partsRepo: testRepo, _debugger: { onOutput }, insId: "myIns"});
        n1.subject.next(5);
        n2.subject.next(10);

        const lastCallArg = onOutput.lastCall.args[0];

        assert.equal(onOutput.callCount, 2);
        assert.equal(lastCallArg.pinId, "r");
        assert.equal(lastCallArg.val, 15);
        assert.equal(lastCallArg.insId, "root.myIns");
      });

      it("intercepts returned value", async () => {
        const n = dynamicPartInput();
        const r = dynamicOutput();

        const s = spy();
        r.subscribe(s);
        execute({part: add1mul2add1, inputs: { n }, outputs: { r }, partsRepo: testRepo, _debugger: {
          onOutput: ({ val, insId }) => {
            // return undefined;
            const newVal = val * 2;
            return {
              cmd: "intercept",
              valuePromise: Promise.resolve(newVal), // intercept only inside
            };
          },
        }});

        n.subject.next(3);

        assert.equal(s.called, false);

        await eventually(() => {
          assert.equal(s.lastCall.args[0], 132); // normal is 9, but we double each of the inputs, so its alot more
        });
      });
    });

    describe("onProcessing()", () => {
      it("notifies when part starts processing", async () => {
        const [item] = dynamicPartInputs(1);
        const r = dynamicOutput();

        const onProcessing = spy();

        const delay = conciseNativePart({
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
        execute({part: delay, inputs: { item }, outputs: { r }, partsRepo: testRepo, _debugger: {
          onProcessing,
        }});

        assert.equal(onProcessing.called, false);
        item.subject.next(3);

        assert.equal(onProcessing.called, true);
        assert.equal(onProcessing.lastCall.args[0].processing, true);
        assert.equal(onProcessing.lastCall.args[0].insId, "root.delay5");
      });

      it("notifies when part ends processing", async () => {
        const [item] = dynamicPartInputs(1);
        const r = dynamicOutput();

        const onProcessing = spy();

        execute({part: delay5, inputs: { item }, outputs: { r }, partsRepo: testRepo, _debugger: {
          onProcessing,
        }});

        item.subject.next("bobs");

        return eventually(() => {
          assert.equal(onProcessing.lastCall.args[0].processing, false);
          assert.equal(onProcessing.lastCall.args[0].insId, "root.delay5");
          assert.equal(onProcessing.callCount, 2);
        }, 200);
      });

      it("notifies with state count when inputs state is changed", async () => {
        const [item] = dynamicPartInputs(1);
        const r = dynamicOutput();

        const onInputsStateChange = spy();

        execute({part: delay5, inputs: { item }, outputs: { r }, partsRepo: testRepo, _debugger: {
          onInputsStateChange,
        }});

        item.subject.next("a");
        item.subject.next("b");

        assert.equal(onInputsStateChange.callCount, 3);

        assert.equal(onInputsStateChange.lastCall.args[0].inputs.item, 1);
        assert.equal(onInputsStateChange.lastCall.args[0].insId, "root.delay5");

        item.subject.next("c");
        assert.equal(onInputsStateChange.lastCall.args[0].inputs.item, 2);

        await eventually(() => {
          assert.equal(onInputsStateChange.lastCall.args[0].inputs.item, 0);
        }, 200);
      });

      it("notifies with state count when inputs state is changed on sticky inputs as well", async () => {
        const [item, ms] = dynamicPartInputs(2);
        const r = dynamicOutput();

        ms.config = stickyInputPinConfig();

        const onInputsStateChange = spy();

        execute({part: delay, inputs: { item, ms }, outputs: { r }, partsRepo: testRepo, _debugger: {
          onInputsStateChange,
        }});

        ms.subject.next(2);
        assert.equal(onInputsStateChange.lastCall.args[0].inputs.ms, 1);

        item.subject.next("a");
        assert.equal(onInputsStateChange.lastCall.args[0].inputs.ms, 1);

        item.subject.next("c");
        assert.equal(onInputsStateChange.lastCall.args[0].inputs.ms, 1);

        await eventually(() => {
          assert.equal(onInputsStateChange.lastCall.args[0].inputs.item, 0);
          assert.equal(onInputsStateChange.lastCall.args[0].inputs.ms, 1);
        }, 200);
      });
    });
  });
});
