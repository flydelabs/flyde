import {
  Node,
  isVisualNode,
  ResolvedFlydeFlow,
  isRefPartInstance,
  RefPartInstance,
  isInlinePartInstance,
  VisualNode,
} from "@flyde/core";
import _ = require("lodash");

const namespaceVisualPart = (
  part: VisualNode,
  namespace: string
): VisualNode => {
  const namespacedInstances = part.instances.map((ins) => {
    if (isInlinePartInstance(ins)) {
      if (isVisualNode(ins.part)) {
        return { ...ins, part: namespaceVisualPart(ins.part, namespace) };
      } else {
        return ins;
      }
    } else {
      return { ...ins, partId: `${namespace}${ins.partId}` };
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
    const namespacedPart = namespaceVisualPart(part, namespace);

    const namespacedImports = _.chain(resolvedFlow.dependencies)
      .mapKeys((_, key) => `${namespace}${key}`)
      .mapValues((part) => {
        const newPart = isVisualNode(part)
          ? {
              ...part,
              instances: part.instances.map((ins) => {
                return isRefPartInstance(ins)
                  ? { ...ins, partId: `${namespace}${ins.partId}` }
                  : ins;
              }),
              id: `${namespace}${part.id}`,
            }
          : {
              ...part,
              id: `${namespace}${part.id}`,
            };
        return newPart;
      })
      .value();

    return {
      ...resolvedFlow,
      main: namespacedPart,
      dependencies: namespacedImports,
    };
  } else {
    return resolvedFlow;
  }
};
