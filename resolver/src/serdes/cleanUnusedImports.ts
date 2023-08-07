import {
  Node,
  isVisualNode,
  isRefNodeInstance,
  isInlineNodeInstance,
  FlydeFlow,
} from "@flyde/core";

const getNodeIds = (part?: Node) => {
  if (part && isVisualNode(part)) {
    const refIds = part.instances
      .filter((ins: any) => isRefNodeInstance(ins))
      .map((ins: any) => ins.nodeId);

    const innerIds = part.instances
      .filter((ins: any) => isInlineNodeInstance(ins))
      .flatMap((ins: any) => getNodeIds(ins.part));

    return [...refIds, ...innerIds];
  } else {
    return [];
  }
};

export const cleanUnusedImports = (flow: FlydeFlow): FlydeFlow => {
  const importedNodeIds = getNodeIds(flow.part as Node);

  console.log({ importedNodeIds });

  const imports = Object.fromEntries(
    Object.entries(flow.imports ?? {}).map(([key, val]) => {
      const ids = (typeof val === "string" ? [val] : val).filter((id) => {
        return importedNodeIds.includes(id);
      });

      return [key, ids];
    })
  );

  return { part: flow.part, imports };
};
