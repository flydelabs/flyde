import { assert } from "chai";
import { spiedOutput } from "../test-utils";

import { processImprovedMacro, ImprovedMacroNode } from "./improved-macros";
import {
  extractInputsFromValue,
  replaceInputsInValue,
} from "./improved-macro-utils";
import { eventually } from "..";
import {
  MacroConfigurableValue,
  macroConfigurableValue,
  nodeOutput,
  dynamicNodeInput,
} from "..";

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

      const macro = processImprovedMacro(SimpleMacro);

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

  describe("JSON Multiline String Macro", () => {
    it("processes multiline input in JSON template", async () => {
      const MultilineJsonMacro: ImprovedMacroNode<{
        data: MacroConfigurableValue;
      }> = {
        id: "MultilineJsonMacro",
        defaultConfig: {
          data: macroConfigurableValue(
            "json",
            `{
              "description": "{{text}}",
              "details": {
                "note": "Simple note"
              }
            }`
          ),
        },
        inputs: (config) => extractInputsFromValue(config.data, "data"),
        outputs: {
          result: nodeOutput(),
        },
        run: (inputs, outputs, ctx) => {
          const data = replaceInputsInValue(
            inputs,
            ctx.context.config.data,
            "data"
          );
          console.log("data", typeof data);
          outputs.result.next(data);
        },
      };

      const macro = processImprovedMacro(MultilineJsonMacro);
      const definition = macro.definitionBuilder(macro.defaultData);
      assert.deepEqual(Object.keys(definition.inputs), ["text"]);
      assert.deepEqual(Object.keys(definition.outputs), ["result"]);

      const runFn = macro.runFnBuilder(macro.defaultData);
      const [spy, result] = spiedOutput();

      const multilineText = `This is a
        multiline description
        with multiple
        lines of text`;

      runFn(
        {
          text: multilineText,
        },
        { result },
        {
          context: { config: macro.defaultData },
        } as any
      );

      await eventually(() => {
        assert.equal(spy.callCount, 1);
        const parsedResult = spy.lastCall.args[0];
        assert.equal(parsedResult.description, multilineText);
      });
    });

    it("preserves non-string property types in JSON template", async () => {
      const TypePreservingMacro: ImprovedMacroNode<{
        data: MacroConfigurableValue;
      }> = {
        id: "TypePreservingMacro",
        defaultConfig: {
          data: macroConfigurableValue(
            "json",
            `{
              "enabled": "{{isEnabled}}",
              "metadata": "{{metadata}}",
              "count": "{{count}}"
            }`
          ),
        },
        inputs: (config) => extractInputsFromValue(config.data, "data"),
        outputs: {
          result: nodeOutput(),
        },
        run: (inputs, outputs, ctx) => {
          const data = replaceInputsInValue(
            inputs,
            ctx.context.config.data,
            "data"
          );
          outputs.result.next(data);
        },
      };

      const macro = processImprovedMacro(TypePreservingMacro);
      const definition = macro.definitionBuilder(macro.defaultData);
      assert.deepEqual(Object.keys(definition.inputs).sort(), [
        "count",
        "isEnabled",
        "metadata",
      ]);
      assert.deepEqual(Object.keys(definition.outputs), ["result"]);

      const runFn = macro.runFnBuilder(macro.defaultData);
      const [spy, result] = spiedOutput();

      const testMetadata = { key: "value", nested: { prop: 123 } };

      runFn(
        {
          isEnabled: true,
          metadata: testMetadata,
          count: 42,
        },
        { result },
        {
          context: { config: macro.defaultData },
        } as any
      );

      await eventually(() => {
        assert.equal(spy.callCount, 1);
        const parsedResult = spy.lastCall.args[0];
        assert.strictEqual(parsedResult.enabled, true);
        assert.strictEqual(parsedResult.count, 42);
        assert.deepEqual(parsedResult.metadata, testMetadata);
        assert.strictEqual(typeof parsedResult.enabled, "boolean");
        assert.strictEqual(typeof parsedResult.count, "number");
        assert.strictEqual(typeof parsedResult.metadata, "object");
      });
    });
  });
});
