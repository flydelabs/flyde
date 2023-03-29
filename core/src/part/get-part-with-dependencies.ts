import { CustomPart, isInlineValuePart } from ".";
import { CustomPartRepo, removeDupes } from "..";
import { isRefPartInstance, RefPartInstance } from "./part-instance";

export const getPartWithDependencies = (
  part: CustomPart,
  repo: CustomPartRepo,
  existingIds: string[] = []
): CustomPart[] => {
  if (isInlineValuePart(part)) {
    return [part];
  }

  if (existingIds.includes(part.id)) {
    return [];
  }
  const deps = removeDupes(
    part.instances
      .filter((i) => isRefPartInstance(i))
      .map((i) => (i as RefPartInstance).partId)
      .filter((i) => repo[i])
  );

  const depsPartsWithDeps = deps
    .flatMap((id) => repo[id] ?? [])
    .reduce<CustomPart[]>((acc, curr) => {
      return [
        ...acc,
        ...getPartWithDependencies(curr, repo, [...existingIds, ...deps]),
      ];
    }, []);

  return [part, ...depsPartsWithDeps];
};
