import { VisualNode, Pos, createInsId } from "@flyde/core";
import produce from "immer";
import { ClipboardData } from "../VisualNodeEditor";

export const pasteInstancesCommand = (
  _part: VisualNode,
  mousePos: Pos,
  clipboardData: ClipboardData
) => {
  const newInstances = clipboardData.instances.map((ins) => {
    return {
      ...ins,
      pos: mousePos,
      id: createInsId(_part),
    };
  });

  const idMap = new Map(
    newInstances.map((ins, idx) => {
      return [clipboardData.instances[idx].id, ins.id];
    })
  );

  const newPart = produce(_part, (draft) => {
    draft.instances.push(...newInstances);

    const newConnections = clipboardData.connections.map(({ from, to }) => {
      return {
        from: { ...from, insId: idMap.get(from.insId) || from.insId },
        to: { ...to, insId: idMap.get(to.insId) || to.insId },
      };
    });

    draft.connections.push(...newConnections);
  });
  return { newPart, newInstances };
};
