import { CustomPart, isCodePart } from ".";
import { CustomPartRepo, removeDupes } from "..";

export const getPartWithDependencies = (part: CustomPart, repo: CustomPartRepo, existingIds: string[] = []): CustomPart[] => {
    if (isCodePart(part)) {
      return [part];
    }

    if (existingIds.includes(part.id)) {
      return [];
    }
    const deps = removeDupes(part.instances
      .map(i => i.partId)
      .filter(i => repo[i])
    );

    const depsPartsWithDeps = deps
      .map(id => repo[id])
      .reduce((acc, curr: CustomPart) => {
        return [...acc, ...getPartWithDependencies(curr, repo, [...existingIds, ...deps])];
      }, []);

    return [part, ...depsPartsWithDeps];
  };
