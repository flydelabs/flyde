import {
  EditorNode,
  EditorVisualNode,
  isVisualNodeInstance,
  isVisualNode,
  VisualNode,
} from "@flyde/core";
import { ReferencedNodeFinder } from "./ReferencedNodeFinder";
import { resolveEditorInstance } from "./resolveEditorInstance";

function dummyErrorNode(msg: string): EditorNode {
  return {
    id: "__errorResolvingNode",
    displayName: "Error",
    description: `Error resolving node: ${msg}`,
    inputs: {},
    outputs: {},
    inputsPosition: {},
    outputsPosition: {},
    connections: [],
    instances: [],
  };
}

export function resolveEditorNode(
  visualNode: VisualNode,
  findReferencedNode: ReferencedNodeFinder
): EditorVisualNode {
  return {
    ...visualNode,
    instances: visualNode.instances.map((instance) => {

      try {
        if (isVisualNodeInstance(instance)) {
          if (instance.source.type === "inline") {
            return {
              ...instance,
              node: resolveEditorNode(instance.source.data, findReferencedNode),
            };
          } else {
            const referencedNode = findReferencedNode(instance);
            if (!referencedNode) {
              throw new Error(`Could not find node definition for ${instance.nodeId}`);
            }
            if (!isVisualNode(referencedNode)) {
              throw new Error(`Node ${instance.nodeId} is not a visual node`);
            }
            return {
              ...instance,
              node: resolveEditorNode(referencedNode, findReferencedNode),
            };
          }
        } else {
          return resolveEditorInstance(instance, findReferencedNode);
        }
      } catch (e) {
        console.error(e);
        return { ...instance, node: dummyErrorNode(e.message) };
      }
    }),
  } as EditorVisualNode;
}
