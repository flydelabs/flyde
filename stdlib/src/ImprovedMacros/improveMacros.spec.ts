import { dynamicNodeInput, eventually, nodeOutput } from "@flyde/core";
import { assert } from "chai";
import { spiedOutput } from "@flyde/core/dist/test-utils";
import {
  extractInputsFromValue,
  macro2toMacro,
  MacroNodeV2,
  replaceInputsInValue,
} from "./improvedMacros";

describe("ImprovedMacros", () => {
  describe("SimpleMacro with dot notation", () => {
    it("processes input with dot notation template", async () => {
      // Define a simple macro node
      const SimpleMacro: MacroNodeV2<{ message: string }> = {
        id: "SimpleMacro",
        defaultConfig: {
          message: "Hello, {{person.name}}! Your age is {{person.age}}.",
        },
        inputs: (config) => extractInputsFromValue(config.message),
        outputs: {
          result: nodeOutput(),
        },
        run: (inputs, outputs, ctx) => {
          const message = replaceInputsInValue(
            inputs,
            ctx.context.config.message
          );

          outputs.result.next(message);
        },
      };

      const macro = macro2toMacro(SimpleMacro);

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
