import { assert } from "chai";
import {
  CodeNodeDefinition,
  CodeNodeInstance,
  EditorVisualNode,
  VisualNode,
  isVisualNode
} from "@flyde/core";
import { resolveEditorInstance } from "./resolveEditorInstance";
import { ReferencedNodeFinder } from "./ReferencedNodeFinder";
import { resolveEditorNode } from "./resolveEditorNode";

describe("resolveEditorNode", () => {
  it("resolves a visual node by resolving each instance", () => {
    const mockVisualNode: VisualNode = {
      id: "TestNode",
      inputs: {},
      outputs: {},
      instances: [{
        id: "instance1",
        nodeId: "TestNode",
        config: {},
        inputConfig: {},
        pos: { x: 100, y: 100 },
        type: "code",
        source: { type: "file", data: "test.flyde" }
      },
      {
        id: "instance2",
        nodeId: "TestNode",
        config: {},
        inputConfig: {},
        pos: { x: 100, y: 100 },
        type: "code",
        source: { type: "file", data: "test.flyde" }
      }],
      connections: [],
      inputsPosition: {},
      outputsPosition: {},
    };

  

    const findReferencedNode: ReferencedNodeFinder = (ins) => {
      const fakeNode = {
        id: `fake-node-for-${ins.id}`,
        inputs: {},
        outputs: {},
        run: () => {},
      }
      return fakeNode;
    };

    const result = resolveEditorNode(mockVisualNode, findReferencedNode);

    assert.equal(result.instances.length, 2);
    assert.equal(result.instances[0].node.id, `fake-node-for-${mockVisualNode.instances[0].id}__instance1`);
    assert.equal(result.instances[1].node.id, `fake-node-for-${mockVisualNode.instances[1].id}__instance2`);
  });


  it("resolves the instances of inline visual nodes", () => {

    const internalVisualNode: VisualNode = {
      id: "InternalVisualNode",
      inputs: {},
      outputs: {},
      instances: [{
        id: "instance1",
        nodeId: "TestNode",
        config: {},
        inputConfig: {},
        pos: { x: 100, y: 100 },
        type: "code",
        source: { type: "file", data: "test.flyde" }
      },
      {
        id: "instance2",
        nodeId: "TestNode",
        config: {},
        inputConfig: {},
        pos: { x: 100, y: 100 },
        type: "code",
        source: { type: "file", data: "test.flyde" }
      }],
      connections: [],
      inputsPosition: {},
      outputsPosition: {},
    };
    const mockVisualNode: VisualNode = {
      id: "TestNode",
      inputs: {},
      outputs: {},
      instances: [{
        id: "instance1",
        nodeId: "TestNode",
        type: 'visual',
        source: { type: "inline", data: internalVisualNode },
        inputConfig: {},
        pos: { x: 100, y: 100 },
      }],
      connections: [],
      inputsPosition: {},
      outputsPosition: {},
    };


    const findReferencedNode: ReferencedNodeFinder = (ins) => {
      const fakeNode = {
        id: `fake-node-for-${ins.id}`,
        inputs: {},
        outputs: {},
        run: () => {},
      }
      return fakeNode;
    };

    const result = resolveEditorNode(mockVisualNode, findReferencedNode);

    const firstResolvedNode = result.instances[0].node as EditorVisualNode;

    assert.equal(firstResolvedNode.instances[0].node.id, `fake-node-for-${mockVisualNode.instances[0].id}__instance1`);
  });

});
