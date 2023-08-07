import { createInsId, VisualNode } from "@flyde/core";
import produce from "immer";

export const handleDuplicateSelectedEditorCommand = (
  node: VisualNode,
  selected: string[]
) => {
  const newInstances = [];
  const newNode = produce(node, (draft) => {
    const instances = draft.instances;
    selected.forEach((id) => {
      const ins = instances.find((ins) => ins.id === id);
      if (!ins) {
        throw new Error(
          `impossible state duplicate selected no matching instance`
        );
      }

      if (ins) {
        const { pos } = ins;
        const newIns = {
          ...ins,
          pos: { x: pos.x + 20, y: pos.y + 20 },
          id: createInsId(node),
        };
        instances.push(newIns);
        newInstances.push(newIns.id);
      }
    });
  });
  return { newNode, newInstances };
};
