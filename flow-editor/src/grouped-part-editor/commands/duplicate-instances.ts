import { GroupedPart } from "@flyde/core";
import cuid from "cuid";
import produce from "immer";

export const handleDuplicateSelectedEditorCommand = (part: GroupedPart, selected: string[]) => {
    const newInstances = [];
  const newPart = produce(part, (draft) => {
    const instances = draft.instances;
    selected.forEach((id) => {
      const ins = instances.find((ins) => ins.id === id);
      if (!ins) {
        throw new Error(`impossible state duplicate selected no matching instance`);
      }

      if (ins) {
        const { pos } = ins;
        const newIns = {
          ...ins,
          pos: { x: pos.x + 20, y: pos.y + 20 },
          id: cuid(),
        };
        instances.push(newIns);
        newInstances.push(newIns.id);
      }
    });
  });
  return {newPart, newInstances};
};
