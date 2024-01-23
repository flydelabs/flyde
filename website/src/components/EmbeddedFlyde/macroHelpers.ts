import {
  ImportedNode,
  MacroNode,
  Node,
  VisualNode,
  isInlineNodeInstance,
  isMacroNode,
  isMacroNodeInstance,
  isVisualNode,
} from "@flyde/core";
import { processMacroNodeInstance } from "@flyde/resolver/dist/resolver/resolve-dependencies/process-macro-node-instance";

export function getMacroData(node: VisualNode): any[] {
  return node.instances.flatMap((ins) => {
    if (isMacroNodeInstance(ins)) {
      return ins.macroData;
    } else if (isInlineNodeInstance(ins) && isVisualNode(ins.node)) {
      return getMacroData(ins.node);
    } else {
      return [];
    }
  });
}

export function processMacroNodes(
  mainNode: VisualNode,
  stdLib: Record<string, Node>
) {
  const newDeps: Record<string, ImportedNode> = {};

  function maybeProcessMacroNodeInstances(node: VisualNode): VisualNode {
    const newInstances = node.instances.map((ins) => {
      if (isMacroNodeInstance(ins)) {
        const macroNode = Object.values(stdLib).find(
          (p) => isMacroNode(p) && p.id === ins.macroId
        ) as unknown as MacroNode<any>;

        if (!macroNode) {
          throw new Error(
            `Could not find macro node ${ins.macroId} in embedded stdlib`
          );
        }

        const newNode = processMacroNodeInstance("", macroNode, ins);

        newDeps[newNode.id] = { ...newNode, source: { path: "" } };
        return { ...ins, nodeId: newNode.id };
      } else if (isInlineNodeInstance(ins) && isVisualNode(ins.node)) {
        return {
          ...ins,
          node: maybeProcessMacroNodeInstances(ins.node),
        };
      } else {
        return ins;
      }
    });
    return { ...node, instances: newInstances };
  }

  const newNode = maybeProcessMacroNodeInstances(mainNode);

  return { newNode, newDeps };
}
