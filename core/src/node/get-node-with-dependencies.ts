import { CustomNodeCollection, removeDupes, VisualNode } from "..";
import { isRefNodeInstance, RefNodeInstance } from "./node-instance";

export const getNodeWithDependencies = (
  node: VisualNode,
  resolvedDeps: CustomNodeCollection,
  existingIds: string[] = []
): VisualNode[] => {
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
    .reduce<VisualNode[]>((acc, curr) => {
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
