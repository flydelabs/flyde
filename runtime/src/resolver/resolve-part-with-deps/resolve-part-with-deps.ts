import { Part, isGroupedPart, ResolvedFlydeFlow, isRefPartInstance, RefPartInstance, isInlinePartInstance } from "@flyde/core";

const getDirectDependencies = (part: Part): string[] => {
    if (isGroupedPart(part)) {
      const arr = part.instances
        .filter(i => isRefPartInstance(i))
        .map((i: RefPartInstance) => i.partId);
      // remove duplicates
      
      return Array.from(new Set(arr)); 
    } else {
      return [];
    }
  }
  
  export const resolvePartWithDeps = (resolvedFlow: ResolvedFlydeFlow, partId: string, parentNs: string = '') => {
  
      const part = resolvedFlow[partId];

      if (!part) {
        throw new Error(`Unable to find part with id [${partId}] in flow`);
      }
  
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
          if (isInlinePartInstance(i)) {
            return i;
          } else {
            return {...i, partId: ns + i.partId};
          }
        });
  
        part.instances = instances;
        return {[nsId]: {...part, id: nsId}, ...deps};
      }
  
  }