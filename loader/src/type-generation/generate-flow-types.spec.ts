import { assert } from "chai";
import { analyzeFlowTypes, generateFlowTypeDeclaration } from "./generate-flow-types";

describe("Type Generation", () => {
  describe("analyzeFlowTypes", () => {
    it("should extract input and output types from a flow", () => {
      const mockFlow = {
        node: {
          inputs: {
            name: {
              mode: "required",
              description: "User's name"
            },
            age: {
              mode: "optional"
            }
          },
          outputs: {
            greeting: {
              description: "Personalized greeting"
            },
            status: {}
          }
        }
      };

      const result = analyzeFlowTypes(mockFlow);

      assert.equal(Object.keys(result.inputs).length, 2);
      assert.equal(Object.keys(result.outputs).length, 2);
      
      assert.equal(result.inputs.name.required, true);
      assert.equal(result.inputs.name.description, "User's name");
      assert.equal(result.inputs.age.required, false);
      
      assert.equal(result.outputs.greeting.description, "Personalized greeting");
    });

    it("should handle flows with no inputs or outputs", () => {
      const mockFlow = {
        node: {
          inputs: {},
          outputs: {}
        }
      };

      const result = analyzeFlowTypes(mockFlow);

      assert.equal(Object.keys(result.inputs).length, 0);
      assert.equal(Object.keys(result.outputs).length, 0);
    });
  });

  describe("generateFlowTypeDeclaration", () => {
    it("should generate valid TypeScript declarations", () => {
      const typeInfo = {
        inputs: {
          name: { type: "string", required: true, description: "User's name" },
          age: { type: "number", required: false }
        },
        outputs: {
          greeting: { type: "string", description: "Personalized greeting" }
        }
      };

      const result = generateFlowTypeDeclaration("test-flow.flyde", typeInfo);

      assert.include(result, "export interface test_flowInputs");
      assert.include(result, "name: string; // User's name");
      assert.include(result, "age?: number;");
      assert.include(result, "export interface test_flowOutputs");
      assert.include(result, "greeting: string; // Personalized greeting");
      assert.include(result, "export type test_flowFlow");
    });

    it("should handle flows with no inputs/outputs", () => {
      const typeInfo = {
        inputs: {},
        outputs: {}
      };

      const result = generateFlowTypeDeclaration("empty-flow.flyde", typeInfo);

      assert.include(result, "Record<string, never>");
    });
  });
});