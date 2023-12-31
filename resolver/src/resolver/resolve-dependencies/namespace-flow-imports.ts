import {
  isVisualNode,
  ResolvedFlydeFlow,
  isRefNodeInstance,
  isInlineNodeInstance,
  VisualNode,
  ResolvedVisualNode,
} from "@flyde/core";
import _ = require("lodash");

const namespaceVisualNode = (
  node: ResolvedVisualNode,
  namespace: string
): ResolvedVisualNode => {
  const namespacedInstances = node.instances.map((ins) => {
    if (isInlineNodeInstance(ins)) {
      if (isVisualNode(ins.node)) {
        return { ...ins, node: namespaceVisualNode(ins.node, namespace) };
      } else {
        return ins;
      }
    } else {
      return { ...ins, nodeId: `${namespace}${ins.nodeId}` };
    }
  });

  return {
    ...node,
    instances: namespacedInstances,
  };
};

export const namespaceFlowImports = (
  resolvedFlow: ResolvedFlydeFlow,
  namespace: string = ""
): ResolvedFlydeFlow => {
  const node = resolvedFlow.main;

  if (isVisualNode(node)) {
    const namespacedNode = namespaceVisualNode(node, namespace);

    const namespacedImports = _.chain(resolvedFlow.dependencies)
      .mapKeys((_, key) => (key === node.id ? key : `${namespace}${key}`))
      .mapValues((node) => {
        const newNode = isVisualNode(node)
          ? {
              ...node,
              instances: node.instances.map((ins) => {
                return isRefNodeInstance(ins)
                  ? { ...ins, nodeId: `${namespace}${ins.nodeId}` }
                  : ins;
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
};
