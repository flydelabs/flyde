import { assert } from "chai";
import { spiedOutput } from "@flyde/core/dist/test-utils";

import { improvedMacroToOldMacro, ImprovedMacroNode } from "./improved-macros";
import {
  extractInputsFromValue,
  replaceInputsInValue,
} from "./improved-macro-utils";
import { eventually } from "@flyde/core";
import {
  MacroConfigurableValue,
  macroConfigurableValue,
  nodeOutput,
  dynamicNodeInput,
} from "../..";

describe("ImprovedMacros", () => {
  describe("SimpleMacro with dot notation", () => {
    it("processes input with dot notation template", async () => {
      // Define a simple macro node
      const SimpleMacro: ImprovedMacroNode<{
        message: MacroConfigurableValue;
      }> = {
        id: "SimpleMacro",
        defaultConfig: {
          message: macroConfigurableValue(
            "string",
            "Hello, {{person.name}}! Your age is {{person.age}}."
          ),
        },
        inputs: (config) => extractInputsFromValue(config.message, "message"),
        outputs: {
          result: nodeOutput(),
        },
        run: (inputs, outputs, ctx) => {
          const message = replaceInputsInValue(
            inputs,
            ctx.context.config.message,
            "message"
          );

          outputs.result.next(message);
        },
      };

      const macro = improvedMacroToOldMacro(SimpleMacro);

      const definition = macro.definitionBuilder(macro.defaultData);
      assert.deepEqual(Object.keys(definition.inputs), ["person"]);
      assert.deepEqual(Object.keys(definition.outputs), ["result"]);

      const runFn = macro.runFnBuilder(macro.defaultData);

      const [spy, result] = spiedOutput();

      const input = dynamicNodeInput();
      const testPerson = { name: "Alice", age: 30 };
      runFn({ person: testPerson }, { result }, {
        context: { config: macro.defaultData },
      } as any);

      input.subject.next(testPerson);

      await eventually(() => {
        assert.equal(spy.callCount, 1);
        assert.equal(spy.lastCall.args[0], "Hello, Alice! Your age is 30.");
      });
    });
  });
});
