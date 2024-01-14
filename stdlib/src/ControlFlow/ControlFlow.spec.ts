import {
  dynamicNodeInput,
  eventually,
  execute,
  inlineNodeInstance,
  randomInt,
  VisualNode,
} from "@flyde/core";
import { assert } from "chai";

import {
  conciseNode,
  spiedOutput,
  valueNode,
} from "@flyde/core/dist/test-utils";
import { Publish, Subscribe } from "./ControlFlow.flyde";

describe("ControlFlow", () => {
  describe("Publish & Subscribe", () => {
    it("publishes and subscribes to a key", async () => {
      const key = "bla";
      const value = randomInt(42);

      const visualNode: VisualNode = conciseNode({
        id: "test",
        inputs: ["a"],
        outputs: ["b"],
        instances: [
          inlineNodeInstance("key", valueNode("key", key)),
          inlineNodeInstance("i1", Publish),
          inlineNodeInstance("i2", Subscribe),
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
        outputs: { b },
        inputs: { a: input },
        resolvedDeps: {},
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
