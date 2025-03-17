import {
  InternalVisualNode,
  isInternalInlineNodeInstance,
  isVisualNode,
  isVisualNodeInstance,
  ResolvedFlydeFlow,
  VisualNode,
  InternalNodeInstance,
  InternalRefNodeInstance,
} from "@flyde/core";
import _ = require("lodash");

const namespaceVisualNode = (
  node: InternalVisualNode,
  namespace: string
): InternalVisualNode => {
  const namespacedInstances = node.instances.map((ins: any) => {
    if (isVisualNodeInstance(ins) && ins.source.type === "inline") {
      const inlineNode = ins.source.data;
      if (isVisualNode(inlineNode)) {
        return {
          ...ins,
          source: {
            ...ins.source,
            data: namespaceVisualNode(inlineNode, namespace),
          },
        };
      } else {
        return ins;
      }
    } else if ("nodeId" in ins) {
      // Handle reference node instances
      return { ...ins, nodeId: `${namespace}${ins.nodeId}` };
    } else {
      return ins;
    }
  });

  return {
    ...node,
    instances: namespacedInstances,
  };
};

export function namespaceFlowImports(
  resolvedFlow: ResolvedFlydeFlow,
  namespace: string = ""
): ResolvedFlydeFlow {
  const node = resolvedFlow.main;

  if (isVisualNode(node)) {
    const namespacedNode = namespaceVisualNode(node, namespace);

    const namespacedImports = _.chain(resolvedFlow.dependencies)
      .mapKeys((_, key) => (key === node.id ? key : `${namespace}${key}`))
      .mapValues((node) => {
        const newNode = isVisualNode(node)
          ? {
              ...node,
              instances: node.instances.map((ins: any) => {
                if (isVisualNodeInstance(ins) && ins.source.type === "inline") {
                  const inlineNode = ins.source.data;
                  if (isVisualNode(inlineNode)) {
                    return {
                      ...ins,
                      source: {
                        ...ins.source,
                        data: namespaceVisualNode(inlineNode, namespace),
                      },
                    };
                  }
                  return ins;
                } else if ("nodeId" in ins) {
                  // Handle reference node instances
                  return { ...ins, nodeId: `${namespace}${ins.nodeId}` };
                } else {
                  return ins;
                }
              }),
              id: `${namespace}${node.id}`,
            }
          : {
              ...node,
              id: `${namespace}${node.id}`,
            };
        return newNode;
      })
      .value();

    return {
      ...resolvedFlow,
      main: namespacedNode,
      dependencies: namespacedImports,
    };
  } else {
    return resolvedFlow;
  }
}
