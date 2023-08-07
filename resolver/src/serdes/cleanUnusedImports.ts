import {
  Node,
  isVisualNode,
  isRefNodeInstance,
  isInlineNodeInstance,
  FlydeFlow,
} from "@flyde/core";

const getNodeIds = (node?: Node) => {
  if (node && isVisualNode(node)) {
    const refIds = node.instances
      .filter((ins: any) => isRefNodeInstance(ins))
      .map((ins: any) => ins.nodeId);

    const innerIds = node.instances
      .filter((ins: any) => isInlineNodeInstance(ins))
      .flatMap((ins: any) => getNodeIds(ins.node));

    return [...refIds, ...innerIds];
  } else {
    return [];
  }
};

export const cleanUnusedImports = (flow: FlydeFlow): FlydeFlow => {
  const importedNodeIds = getNodeIds(flow.node as Node);

  console.log({ importedNodeIds });

  const imports = Object.fromEntries(
    Object.entries(flow.imports ?? {}).map(([key, val]) => {
      const ids = (typeof val === "string" ? [val] : val).filter((id) => {
        return importedNodeIds.includes(id);
      });

      return [key, ids];
    })
  );

  return { node: flow.node, imports };
};
