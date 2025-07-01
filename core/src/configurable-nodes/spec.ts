import { assert } from "chai";
import { spiedOutput } from "../test-utils";

import { processConfigurableNode, CodeNode } from "./configurable-nodes";
import {
  extractInputsFromValue,
  replaceInputsInValue,
  evaluateCondition,
} from "./configurable-node-utils";
import { eventually } from "..";
import { ConfigurableValue, ConfigurableEditorConfigStructured } from "..";

import { dynamicNodeInput } from "../node";

import { nodeOutput } from "../node";

import { configurableValue } from "../node/configurable-value";

describe("ConfigurableNodes", () => {
  describe("SimpleMacro with dot notation", () => {
    it("processes input with dot notation template", async () => {
      // Define a simple macro node
      const SimpleMacro: CodeNode<{
        message: ConfigurableValue;
      }> = {
        id: "SimpleMacro",
        mode: "advanced",
        defaultConfig: {
          message: configurableValue(
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

      const macro = processConfigurableNode(SimpleMacro);

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
      const MultilineJsonMacro: CodeNode<{
        data: ConfigurableValue;
      }> = {
        id: "MultilineJsonMacro",
        mode: "advanced",
        defaultConfig: {
          data: configurableValue(
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

      const macro = processConfigurableNode(MultilineJsonMacro);
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
      const TypePreservingMacro: CodeNode<{
        data: ConfigurableValue;
      }> = {
        id: "TypePreservingMacro",
        mode: "advanced",
        defaultConfig: {
          data: configurableValue(
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

      const macro = processConfigurableNode(TypePreservingMacro);
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

  describe("Conditional Inputs", () => {
    it("supports conditional inputs based on string expressions", async () => {
      const ConditionalInputsMacro: CodeNode = {
        id: "ConditionalInputsMacro",
        displayName: "Conditional Inputs Macro",
        inputs: {
          method: {
            defaultValue: "GET",
            label: "Method",
            editorType: "select",
            editorTypeData: {
              options: ["GET", "POST", "PUT", "DELETE"],
            },
          },
          body: {
            defaultValue: {},
            label: "Request Body",
            editorType: "json",
            condition: "method !== 'GET'",
          },
          headers: {
            defaultValue: {},
            label: "Headers",
            editorType: "json",
            condition: "method !== 'GET' && method !== 'HEAD'",
          },
        },
        outputs: {
          result: nodeOutput(),
        },
        run: (inputs, outputs) => {
          const { method, body, headers } = inputs;
          outputs.result.next({
            method,
            body: method === "GET" ? undefined : body,
            headers: method === "GET" ? undefined : headers,
          });
        },
      };

      const macro = processConfigurableNode(ConditionalInputsMacro);

      // Verify that the conditions are passed to the field definitions
      const editorConfig = macro.editorConfig as ConfigurableEditorConfigStructured;
      const bodyField = editorConfig.fields.find(
        (field) => field.configKey === "body"
      );
      const headersField = editorConfig.fields.find(
        (field) => field.configKey === "headers"
      );

      assert.ok(bodyField);
      assert.ok(headersField);
      assert.equal(typeof (bodyField as any).condition, "string");
      assert.equal(typeof (headersField as any).condition, "string");

      // Test that the string conditions work correctly with evaluateCondition
      const getMethodConfig = { method: { type: "select", value: "GET" } };
      const postMethodConfig = { method: { type: "select", value: "POST" } };
      const headMethodConfig = { method: { type: "select", value: "HEAD" } };

      assert.equal(
        evaluateCondition((bodyField as any).condition, getMethodConfig),
        false
      );
      assert.equal(
        evaluateCondition((bodyField as any).condition, postMethodConfig),
        true
      );

      assert.equal(
        evaluateCondition((headersField as any).condition, getMethodConfig),
        false
      );
      assert.equal(
        evaluateCondition((headersField as any).condition, headMethodConfig),
        false
      );
      assert.equal(
        evaluateCondition((headersField as any).condition, postMethodConfig),
        true
      );
    });
  });
});
