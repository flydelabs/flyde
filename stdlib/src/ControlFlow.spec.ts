import {
  dynamicPartInput,
  eventually,
  execute,
  inlinePartInstance,
  randomInt,
  staticInputPinConfig,
  VisualPart,
} from "@flyde/core";
import { assert } from "chai";

import { concisePart, spiedOutput } from "@flyde/core/dist/test-utils";
import { Publish, Subscribe } from "./ControlFlow.flyde";

describe("ControlFlow", () => {
  describe("Publish & Subscribe", () => {
    it("publishes and subscribes to a key", async () => {
      const key = "bla";
      const value = randomInt(42);

      const visualPart: VisualPart = concisePart({
        id: "test",
        inputs: ["a"],
        outputs: ["b"],
        instances: [
          inlinePartInstance("i1", Publish, { key: staticInputPinConfig(key) }),
          inlinePartInstance("i2", Subscribe, {
            key: staticInputPinConfig(key),
          }),
        ],
        connections: [
          ["a", "i1.value"],
          ["i2.value", "b"],
        ],
      });

      const [s, b] = spiedOutput();

      const input = dynamicPartInput();

      execute({
        part: visualPart,
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
