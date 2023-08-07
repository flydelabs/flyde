import {
  Node,
  isVisualNode,
  ResolvedFlydeFlow,
  isRefNodeInstance,
  RefNodeInstance,
  isInlineNodeInstance,
  VisualNode,
} from "@flyde/core";
import _ = require("lodash");

const namespaceVisualNode = (
  part: VisualNode,
  namespace: string
): VisualNode => {
  const namespacedInstances = part.instances.map((ins) => {
    if (isInlineNodeInstance(ins)) {
      if (isVisualNode(ins.part)) {
        return { ...ins, part: namespaceVisualNode(ins.part, namespace) };
      } else {
        return ins;
      }
    } else {
      return { ...ins, nodeId: `${namespace}${ins.nodeId}` };
    }
  });
  return {
    ...part,
    instances: namespacedInstances,
  };
};

export const namespaceFlowImports = (
  resolvedFlow: ResolvedFlydeFlow,
  namespace: string = ""
): ResolvedFlydeFlow => {
  const part = resolvedFlow.main;
  if (isVisualNode(part)) {
    const namespacedNode = namespaceVisualNode(part, namespace);

    const namespacedImports = _.chain(resolvedFlow.dependencies)
      .mapKeys((_, key) => `${namespace}${key}`)
      .mapValues((part) => {
        const newNode = isVisualNode(part)
          ? {
              ...part,
              instances: part.instances.map((ins) => {
                return isRefNodeInstance(ins)
                  ? { ...ins, nodeId: `${namespace}${ins.nodeId}` }
                  : ins;
              }),
              id: `${namespace}${part.id}`,
            }
          : {
              ...part,
              id: `${namespace}${part.id}`,
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
