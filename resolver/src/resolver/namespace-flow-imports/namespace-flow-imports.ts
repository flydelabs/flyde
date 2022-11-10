import {
  Part,
  isGroupedPart,
  ResolvedFlydeFlow,
  isRefPartInstance,
  RefPartInstance,
  isInlinePartInstance,
  GroupedPart,
} from "@flyde/core";
import _ = require("lodash");


const namespaceGroupedPart = (part: GroupedPart, namespace: string): GroupedPart => {
  const namespacedInstances = part.instances
    .map(ins => {
      if (isInlinePartInstance(ins)) {
        if (isGroupedPart(ins.part)) {
          return {...ins, part: namespaceGroupedPart(ins.part, namespace)}
        } else {
          return ins;
        }
      } else {
        return {...ins, partId: `${namespace}${ins.partId}`}
      }
    })
  return {
    ...part,
    instances: namespacedInstances
  }
}


export const namespaceFlowImports = (
  resolvedFlow: ResolvedFlydeFlow,
  namespace: string = ""
): ResolvedFlydeFlow => {
  const part = resolvedFlow.main;
  if (isGroupedPart(part)) {
    const namespacedPart = namespaceGroupedPart(part, namespace);

    const namespacedImports = _.chain(resolvedFlow.dependencies)
      .mapKeys((_, key) => `${namespace}${key}`)
      .mapValues((part) => {
        const newPart = isGroupedPart(part)
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
