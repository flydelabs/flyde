import { VisualNode, Pos, createInsId } from "@flyde/core";
import produce from "immer";
import { ClipboardData } from "../VisualNodeEditor";

export const pasteInstancesCommand = (
  _node: VisualNode,
  mousePos: Pos,
  clipboardData: ClipboardData
) => {
  const newInstances = clipboardData.instances.map((ins) => {
    const id = createInsId(_node);
    return {
      ...ins,
      pos: mousePos,
      id,
    };
  });

  const idMap = new Map(
    newInstances.map((ins, idx) => {
      return [clipboardData.instances[idx]?.id, ins.id];
    })
  );

  const newNode = produce(_node, (draft) => {
    draft.instances.push(...newInstances);

    const newConnections = clipboardData.connections.map(({ from, to }) => {
      return {
        from: { ...from, insId: idMap.get(from.insId) || from.insId },
        to: { ...to, insId: idMap.get(to.insId) || to.insId },
      };
    });

    draft.connections.push(...newConnections);
  });
  return { newNode, newInstances };
};
