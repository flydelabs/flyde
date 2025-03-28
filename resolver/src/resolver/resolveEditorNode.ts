import {
  EditorVisualNode,
  isVisualNodeInstance,
  VisualNode,
} from "@flyde/core";
import { ReferencedNodeFinder } from "./ReferencedNodeFinder";
import { resolveEditorInstance } from "./resolveEditorInstance";

export function resolveEditorNode(
  visualNode: VisualNode,
  findReferencedNode: ReferencedNodeFinder
): EditorVisualNode {
  return {
    ...visualNode,
    instances: visualNode.instances.map((instance) => {
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
    }),
  } as EditorVisualNode;
}
