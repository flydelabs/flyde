import {
  Node,
  isVisualNode,
  isRefNodeInstance,
  isInlineNodeInstance,
  FlydeFlow,
  isMacroNodeInstance,
  MacroNodeInstance,
} from "@flyde/core";

const getNodeOrMacroIds = (node?: Node) => {
  if (node && isVisualNode(node)) {
    const refIds = node.instances
      .filter((ins: any) => isRefNodeInstance(ins))
      .map((ins: any) => ins.nodeId);

    const macroIds = node.instances
      .filter((ins): ins is MacroNodeInstance => isMacroNodeInstance(ins))
      .map((ins) => ins.macroId);

    const innerIds = node.instances
      .filter((ins: any) => isInlineNodeInstance(ins))
      .flatMap((ins: any) => getNodeOrMacroIds(ins.node));

    return [...refIds, ...innerIds, ...macroIds];
  } else {
    return [];
  }
};

export const cleanUnusedImports = (flow: FlydeFlow): FlydeFlow => {
  const importedNodeIds = getNodeOrMacroIds(flow.node as Node);

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
