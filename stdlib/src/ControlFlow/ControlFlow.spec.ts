import {
  dynamicNodeInput,
  eventually,
  execute,
  inlineNodeInstance,
  macroNodeInstance,
  processImprovedMacro,
  processMacroNodeInstance,
  randomInt,
  VisualNode,
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

      const i1 = macroNodeInstance("i1", _pub.id, {});
      const i2 = macroNodeInstance("i2", _sub.id, {});

      const _pubNode = processMacroNodeInstance("i1", _pub, i1);
      const _subNode = processMacroNodeInstance("i2", _sub, i2);

      const visualNode: VisualNode = conciseNode({
        id: "test",
        inputs: ["a"],
        outputs: ["b"],
        instances: [
          inlineNodeInstance("key", valueNode("key", key)),
          inlineNodeInstance("i1", _pubNode),
          inlineNodeInstance("i2", _subNode),
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
