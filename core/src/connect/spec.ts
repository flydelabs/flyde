import { connect, connectionNode } from ".";

import { Subject } from "rxjs";

import { spy } from "sinon";

import { assert } from "chai";
import { dynamicPartInput, NativePart, partInput, partInstance, partOutput } from "../part";
import { execute } from "../execute";
import { runAddTests } from "../part/add-tests";
import { add, optAdd, testRepo } from "../fixture";
import { connectionData } from "./helpers";

describe("is connected", () => {});

describe("connect", () => {

  describe("optional inputs", () => {
    it("allows not renaming an optional pin that is connected", () => {
      assert.doesNotThrow(() => {
        connect(
          {
            id: "bob",
            instances: [partInstance("a", optAdd.id)],
            connections: [],
            inputs: {},
            outputs: {}
          },
          testRepo
        );
      });
    });

    it("runs properly when optional arg is not passed", () => {
      const part = connect(
        {
          id: "bob",
          instances: [partInstance("a", optAdd.id)],
          connections: [
            connectionData('n1', 'a.n1'),
            connectionData('a.r', 'r')
          ],
          inputs: {
            n1: partInput()
          },
          outputs: {
            r: partOutput()
          },
        },
        testRepo
      );

      const n1 = dynamicPartInput();
      const r = new Subject();
      const fn = spy();
      r.subscribe(fn);
      execute({part: part, inputs: { n1 }, outputs: { r }, partsRepo: testRepo});
      n1.subject.next(4);
      assert.equal(fn.callCount, 1);
      assert.equal(fn.lastCall.args[0], 46);
    });

    it("waits for optional input if passed", () => {
      const part = connect(
        {
          id: "bob",
          instances: [partInstance("a", optAdd.id)],
          connections: [
            connectionData('n1', 'a.n1'),
            connectionData('n2', 'a.n2'),
            connectionData('a.r', 'r'),
          ],
          inputs: {
            n1: partInput(),
            n2: partInput(),
          },
          outputs: {
            r: partOutput()
          }
        },
        testRepo
      );

      const n1 = dynamicPartInput();
      const n2 = dynamicPartInput();
      const r = new Subject();
      const fn = spy();
      r.subscribe(fn);
      execute({part: part, inputs: { n1, n2 }, outputs: { r }, partsRepo: testRepo});
      n2.subject.next(4);
      n1.subject.next(6);
      assert.equal(fn.callCount, 1);
      assert.equal(fn.lastCall.args[0], 10);
    });
  });

  describe("optional outputs", () => {
    const optOutput: NativePart = {
      id: "dup",
      inputs: {
        v: { type: "any" },
      },
      outputs: {
        r1: { type: "number" },
        r2: { type: "number", optional: true },
      },
      fn: ({ v }, { r1, r2 }) => {
        r1.next(v);
        if (r2) {
          r2.next(v);
        }
      },
    };
  });

  describe("cyclic dependencies", () => {
    it.skip("allows closing cyclic dependencies with delayed parts", () => {
      const delayedId: NativePart = {
        id: "d",
        inputs: { n: { type: "any" } },
        outputs: { r: { type: "any", delayed: true } },
        fn: ({ n }, { r }) => {
          setInterval(() => {
            r.next(n);
          });
        },
      };

      const part = connect(
        {
          id: "bob",
          instances: [
            partInstance("d", delayedId.id),
            partInstance("add", add.id),
            // partInstance('m', merge, {
            // 	b: {type: 'static', value: 0}
            // }),
          ],
          connections: [
            {
              from: connectionNode("d", "r"),
              to: connectionNode("add", "val"),
            },
            {
              from: connectionNode("i", "r"),
              to: connectionNode("m", "a"),
            },
            {
              from: connectionNode("m", "r"),
              to: connectionNode("d", "n"),
            },
            connectionData('m.r', 'r')
          ],
          inputs: {
          },
          outputs: {
            r: partOutput()
          }
        },
        testRepo
      );

      const fn = spy();
      const r = new Subject();
      r.subscribe(fn);

      execute({part: part, inputs: {}, outputs: { r }, partsRepo: testRepo});

    });
  });

  describe("passes normal part specs when connected with no other pieces", () => {
    const part = connect(
      {
        id: "bob",
        instances: [partInstance("a", add.id)],
        connections: [
          connectionData('n1', 'a.n1'),
          connectionData('n2', 'a.n2'),
          connectionData('a.r', 'r')
        ],
        inputs: {
          "n1": partInput(),
          "n2": partInput()
        },
        outputs: {
          "r": partOutput()
        }
      },
      testRepo
    );

    runAddTests(part, "connect", testRepo);
  });
});
