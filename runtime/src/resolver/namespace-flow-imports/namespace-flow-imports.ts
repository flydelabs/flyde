import { Part, isGroupedPart, ResolvedFlydeFlow, isRefPartInstance, RefPartInstance, isInlinePartInstance } from "@flyde/core";
import _ = require("lodash");

  export const namespaceFlowImports = (resolvedFlow: ResolvedFlydeFlow, namespace: string = ''): ResolvedFlydeFlow => {

    const part = resolvedFlow.main;
    if (isGroupedPart(part)) {
      
      const namespacedPart = {
        ...part,
        instances: part.instances.map((ins) => {
          return isRefPartInstance(ins) ? {...ins, partId: `${namespace}${ins.partId}`} : ins
        })
      };

      const namespacedImports = _.chain(resolvedFlow.dependencies)
        .mapKeys((_, key) => `${namespace}${key}`)
        .mapValues((part) => {
          const newPart = isGroupedPart(part) ? {
            ...part,
            instances: part.instances.map(ins => {
              return isRefPartInstance(ins) ? {...ins, partId: `${namespace}${ins.partId}`} : ins
            }),
            id: `${namespace}${part.id}`
          } : {
            ...part,
            id: `${namespace}${part.id}`
          }
          return newPart;
        })
      .value();
      
        
      return {
        ...resolvedFlow,
        main: namespacedPart,
        dependencies: namespacedImports
      }
    } else {
      return resolvedFlow;
    }

  
  }