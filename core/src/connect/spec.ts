import { connect, connectionNode } from ".";

import { Subject } from "rxjs";

import { spy } from "sinon";

import { assert } from "chai";
import {
  dynamicNodeInput,
  InternalCodeNode,
  nodeInput,
  nodeInstance,
  nodeOutput,
} from "../node";
import { execute } from "../execute";
import { runAddTests } from "../node/add-tests";
import { add, optAdd, testNodesCollection } from "../fixture";
import { connectionData } from "./helpers";

describe("is connected", () => {});

describe("connect", () => {
  describe("optional inputs", () => {
    it("allows not renaming an optional pin that is connected", () => {
      assert.doesNotThrow(() => {
        connect(
          {
            id: "bob",
            instances: [nodeInstance("a", optAdd.id)],
            connections: [],
            inputs: {},
            outputs: {},
          },
          testNodesCollection
        );
      });
    });

    it("runs properly when optional arg is not passed", () => {
      const node = connect(
        {
          id: "bob",
          instances: [nodeInstance("a", optAdd.id)],
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
      const r = new Subject();
      const fn = spy();
      r.subscribe(fn);
      execute({
        node: node,
        inputs: { n1 },
        outputs: { r },
        resolvedDeps: testNodesCollection,
      });
      n1.subject.next(4);
      assert.equal(fn.callCount, 1);
      assert.equal(fn.lastCall.args[0], 46);
    });

    it("waits for optional input if passed", () => {
      const node = connect(
        {
          id: "bob",
          instances: [nodeInstance("a", optAdd.id)],
          connections: [
            connectionData("n1", "a.n1"),
            connectionData("n2", "a.n2"),
            connectionData("a.r", "r"),
          ],
          inputs: {
            n1: nodeInput(),
            n2: nodeInput(),
          },
          outputs: {
            r: nodeOutput(),
          },
        },
        testNodesCollection
      );

      const n1 = dynamicNodeInput();
      const n2 = dynamicNodeInput();
      const r = new Subject();
      const fn = spy();
      r.subscribe(fn);
      execute({
        node: node,
        inputs: { n1, n2 },
        outputs: { r },
        resolvedDeps: testNodesCollection,
      });
      n2.subject.next(4);
      n1.subject.next(6);
      assert.equal(fn.callCount, 1);
      assert.equal(fn.lastCall.args[0], 10);
    });
  });

  describe("cyclic dependencies", () => {
    it.skip("allows closing cyclic dependencies with delayed nodes", () => {
      const delayedId: InternalCodeNode = {
        id: "d",
        inputs: { n: {} },
        outputs: { r: { delayed: true } },
        run: ({ n }, { r }) => {
          setInterval(() => {
            r?.next(n);
          });
        },
      };

      const node = connect(
        {
          id: "bob",
          instances: [
            nodeInstance("d", delayedId.id),
            nodeInstance("add", add.id),
            // nodeInstance('m', merge, {
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
            connectionData("m.r", "r"),
          ],
          inputs: {},
          outputs: {
            r: nodeOutput(),
          },
        },
        testNodesCollection
      );

      const fn = spy();
      const r = new Subject();
      r.subscribe(fn);

      execute({
        node: node,
        inputs: {},
        outputs: { r },
        resolvedDeps: testNodesCollection,
      });
    });
  });

  describe("passes normal node specs when connected with no other pieces", () => {
    const node = connect(
      {
        id: "bob",
        instances: [nodeInstance("a", add.id)],
        connections: [
          connectionData("n1", "a.n1"),
          connectionData("n2", "a.n2"),
          connectionData("a.r", "r"),
        ],
        inputs: {
          n1: nodeInput(),
          n2: nodeInput(),
        },
        outputs: {
          r: nodeOutput(),
        },
      },
      testNodesCollection
    );

    runAddTests(node, "connect", testNodesCollection);
  });
});
