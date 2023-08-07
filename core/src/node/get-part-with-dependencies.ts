import { CustomNode, isInlineValueNode } from ".";
import { CustomNodeCollection, removeDupes } from "..";
import { isRefNodeInstance, RefNodeInstance } from "./node-instance";

export const getNodeWithDependencies = (
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
      .filter((i) => isRefNodeInstance(i))
      .map((i) => (i as RefNodeInstance).nodeId)
      .filter((i) => resolvedDeps[i])
  );

  const depsNodesWithDeps = deps
    .flatMap((id) => resolvedDeps[id] ?? [])
    .reduce<CustomNode[]>((acc, curr) => {
      return [
        ...acc,
        ...getNodeWithDependencies(curr, resolvedDeps, [
          ...existingIds,
          ...deps,
        ]),
      ];
    }, []);

  return [part, ...depsNodesWithDeps];
};
