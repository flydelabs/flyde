import {
  EditorNode,
  EditorVisualNode,
  isVisualNodeInstance,
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
            throw new Error("Unsupported instance source type: " + instance.source.type);
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
