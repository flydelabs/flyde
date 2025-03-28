import { createInsId, EditorVisualNode } from "@flyde/core";
import produce from "immer";

export const handleDuplicateSelectedEditorCommand = (
  node: EditorVisualNode,
  selected: string[]
) => {
  const newInstancesIds: string[] = [];
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
        const newPos = { x: pos.x + 20, y: pos.y + 20 };
        const id = createInsId(node);

        const newIns = {
          ...ins,
          pos: newPos,
          id,
        };
        instances.push(newIns);
        newInstancesIds.push(newIns.id);
      }
    });
  });
  return { newNode, newInstancesIds };
};
