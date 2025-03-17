import {
  dynamicNodeInput,
  eventually,
  execute,
  internalNodeInstance,
  InternalVisualNode,
  processImprovedMacro,
  processMacroNodeInstance,
  randomInt,
} from "@flyde/core";
import { assert } from "chai";

import {
  conciseNode,
  spiedOutput,
  valueNode,
} from "@flyde/core/dist/test-utils";
import { Publish } from "./Publish.flyde";
import { Subscribe } from "./Subscribe.flyde";

describe("ControlFlow", () => {
  describe("Publish & Subscribe", () => {
    it("publishes and subscribes to a key", async () => {
      const key = "bla";
      const value = randomInt(42);

      const _pub = processImprovedMacro(Publish);
      const _sub = processImprovedMacro(Subscribe);

      const _pubNode = processMacroNodeInstance("i1", _pub, {
        id: "i1",
        config: {},
      });
      const _subNode = processMacroNodeInstance("i2", _sub, {
        id: "i2",
        config: {},
      });

      const valNode = valueNode("key", key);

      const visualNode: InternalVisualNode = conciseNode({
        id: "test",
        inputs: ["a"],
        outputs: ["b"],
        instances: [
          internalNodeInstance("key", valNode.id, {}),
          internalNodeInstance("i1", _pubNode.id, {}),
          internalNodeInstance("i2", _subNode.id, {}),
        ],
        connections: [
          ["key.r", "i1.key"],
          ["key.r", "i2.key"],
          ["a", "i1.value"],
          ["i2.value", "b"],
        ],
      });

      const [s, b] = spiedOutput();

      const input = dynamicNodeInput();

      execute({
        node: visualNode,
        inputs: { a: input },
        outputs: { b },
        resolvedDeps: {
          [_pubNode.id]: _pubNode,
          [_subNode.id]: _subNode,
          [valNode.id]: valNode,
        },
        ancestorsInsIds: "bob",
      });

      input.subject.next(value);

      await eventually(() => {
        assert.equal(s.callCount, 1);
        assert.equal(s.lastCall.args[0], value);
      });
    });
  });
});
