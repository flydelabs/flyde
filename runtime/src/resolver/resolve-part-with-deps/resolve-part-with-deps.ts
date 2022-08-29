import { Part, isGroupedPart, ResolvedFlydeFlowDefinition, ResolvedFlydeFlow } from "@flyde/core";

const getDirectDependencies = (part: Part): string[] => {
    if (isGroupedPart(part)) {
      const arr = part.instances.map(i => i.partId);
      // remove duplicates
      return Array.from(new Set(arr)); 
    } else {
      return [];
    }
  }
  
  export const resolvePartWithDeps = (resolvedFlow: ResolvedFlydeFlow, partId: string, parentNs: string = '') => {
  
      const part = resolvedFlow[partId];
  
      const dependencies = getDirectDependencies(part);
  
      const nsId = parentNs + partId
      if (!dependencies.length) {
        return {[nsId]: {...part, id: nsId}};
      } else {
        if (!isGroupedPart(part)){
          throw new Error('Part is not grouped but has dependencies');
        }
  
        const ns = nsId + '__';
  
        const deps = dependencies.reduce((acc, dep) => {
          return {...acc, ...resolvePartWithDeps(resolvedFlow, dep, ns)};
        }, {});
  
        const instances = part.instances.map(i => {
          return {...i, partId: ns + i.partId};
        });
  
        part.instances = instances;
        return {[nsId]: {...part, id: nsId}, ...deps};
      }
  
  }