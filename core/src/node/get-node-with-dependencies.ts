import { CustomNode, isInlineValueNode } from ".";
import { CustomNodeCollection, removeDupes } from "..";
import { isRefNodeInstance, RefNodeInstance } from "./node-instance";

export const getNodeWithDependencies = (
  node: CustomNode,
  resolvedDeps: CustomNodeCollection,
  existingIds: string[] = []
): CustomNode[] => {
  if (isInlineValueNode(node)) {
    return [node];
  }

  if (existingIds.includes(node.id)) {
    return [];
  }
  const deps = removeDupes(
    node.instances
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

  return [node, ...depsNodesWithDeps];
};
