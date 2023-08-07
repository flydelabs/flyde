import { CustomNode, isInlineValueNode } from ".";
import { CustomNodeCollection, removeDupes } from "..";
import { isRefPartInstance, RefPartInstance } from "./part-instance";

export const getPartWithDependencies = (
  part: CustomNode,
  resolvedDeps: CustomNodeCollection,
  existingIds: string[] = []
): CustomNode[] => {
  if (isInlineValueNode(part)) {
    return [part];
  }

  if (existingIds.includes(part.id)) {
    return [];
  }
  const deps = removeDupes(
    part.instances
      .filter((i) => isRefPartInstance(i))
      .map((i) => (i as RefPartInstance).partId)
      .filter((i) => resolvedDeps[i])
  );

  const depsPartsWithDeps = deps
    .flatMap((id) => resolvedDeps[id] ?? [])
    .reduce<CustomNode[]>((acc, curr) => {
      return [
        ...acc,
        ...getPartWithDependencies(curr, resolvedDeps, [
          ...existingIds,
          ...deps,
        ]),
      ];
    }, []);

  return [part, ...depsPartsWithDeps];
};
