import {
  InternalVisualNode,
  isVisualNode,
  isVisualNodeInstance,
  processMacroNodeInstance,
  VisualNode,
  isInlineVisualNodeInstance,
  isCodeNode,
} from "@flyde/core";
import { ReferencedNodeFinder } from "./ReferencedNodeFinder";

/*
Recursively resolve all dependencies of a flow. For each node instance:
1. If it's an inline visual node, recursively resolve it
2. If it's a reference to another node, find and link the actual node definition
*/
export function resolveVisualNode(
  visualNode: VisualNode,
  nodeFinder: ReferencedNodeFinder
): InternalVisualNode {

  const internalInstances = visualNode.instances.map((instance) => {
    if (isInlineVisualNodeInstance(instance)) {
      const resolved = resolveVisualNode(instance.source.data, nodeFinder);
      // TODO: weird gap in types? This seems to be similar to createInternalInlineNodeInstance - need to double check
      return {
        id: instance.id,
        node: resolved,
        inputConfig: instance.inputConfig,
      };
    }

    if (isVisualNodeInstance(instance)) {
      if (instance.source.type === "self") {
        return {
          ...instance,
          node: "__SELF" as any,
        };
      }

      const node = nodeFinder(instance);

      if (isVisualNode(node)) {
        const resolved = resolveVisualNode(node, nodeFinder);

        return {
          ...instance,
          node: resolved,
        };
      }

      return {
        ...instance,
        node,
      };
    }

    const node = nodeFinder(instance);


    if (isVisualNode(node)) {
      const resolved = resolveVisualNode(node, nodeFinder);
      return {
        ...instance,
        node: resolved,
      };
    }

    // Only process the node if it's a CodeNode, not a VisualNode
    if (node && isCodeNode(node)) {
      const processed = processMacroNodeInstance("", node, instance);

      return {
        ...instance,
        node: processed,
      };
    } else {
      throw new Error(`Cannot process node ${instance.nodeId} ${JSON.stringify(instance)  }`);
    }

  });

  const newNode: InternalVisualNode = {
    ...visualNode,
    instances: internalInstances,
  };

  for (const ins of newNode.instances) {
    if ((ins.node as any) === "__SELF") {
      ins.node = newNode;
    }
  }

  return newNode;
}
