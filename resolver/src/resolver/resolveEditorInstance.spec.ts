import { assert } from "chai";
import { 
  CodeNodeInstance, 
  VisualNode,
  isVisualNode 
} from "@flyde/core";
import { resolveEditorInstance } from "./resolveEditorInstance";
import { ReferencedNodeFinder } from "./ReferencedNodeFinder";

describe("resolveEditorInstance", () => {
  it("resolves a visual node instance correctly", () => {
    const mockVisualNode: VisualNode = {
      id: "TestNode",
      inputs: {},
      outputs: {},
      instances: [],
      connections: [],
      inputsPosition: {},
      outputsPosition: {},
    };
    
    const instance: CodeNodeInstance = {
      id: "instance1",
      nodeId: "TestNode",
      config: {},
      inputConfig: {},
      pos: { x: 100, y: 100 },
      style: { color: "blue" },
      type: "code",
      source: { type: "file", data: "test.flyde" }
    };

    const findReferencedNode: ReferencedNodeFinder = () => mockVisualNode;
    
    const result = resolveEditorInstance(instance, findReferencedNode);
    
    assert.equal(result.id, "instance1");
    assert.equal(result.nodeId, "TestNode");
    assert.deepEqual(result.pos, { x: 100, y: 100 });
  });

  it("resolves a non-visual node instance correctly", () => {
    // Since we don't know what the exact type of a non-visual node is, we'll use 'any'
    const mockNonVisualNode: any = {
      id: "CodeNode",
      inputs: {},
      outputs: {},
      defaultData: { value: 5 },
      // Additional properties needed for node processing
    };
    
    const instance: CodeNodeInstance = {
      id: "instance2",
      nodeId: "CodeNode",
      config: {},
      inputConfig: {},
      pos: { x: 200, y: 200 },
      style: {},
      type: "code",
      source: { type: "file", data: "test.flyde" }
    };

    const findReferencedNode: ReferencedNodeFinder = () => mockNonVisualNode;
    
    const result = resolveEditorInstance(instance, findReferencedNode);
    
    assert.equal(result.id, "instance2");
    assert.equal(result.nodeId, "CodeNode");
    assert.deepEqual(result.pos, { x: 200, y: 200 });
  });

  it("throws error when node definition is not found", () => {
    const instance: CodeNodeInstance = {
      id: "instance3",
      nodeId: "NonExistentNode",
      config: {},
      inputConfig: {},
      pos: { x: 300, y: 300 },
      style: {},
      type: "code",
      source: { type: "file", data: "test.flyde" }
    };

    const findReferencedNode: ReferencedNodeFinder = () => null;
    
    assert.throws(() => {
      resolveEditorInstance(instance, findReferencedNode);
    }, Error, "Could not find node definition for NonExistentNode");
  });
});
