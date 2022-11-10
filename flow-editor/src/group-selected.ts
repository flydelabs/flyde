import { GroupedPart, PartDefRepo, partInstance, ConnectionData, inlinePartInstance } from "@flyde/core";
import produce from "immer";
import { createGroup } from "./lib/create-group";
import { middlePos } from "./grouped-part-editor/utils";
import { PromptFn } from "./flow-editor/ports";

export const groupSelected = async (
  selected: string[],
  part: GroupedPart,
  partName: string,
  type: 'inline' | 'ref',
  prompt: PromptFn
): Promise<{ newPart: GroupedPart; currentPart: GroupedPart }> => {
  const { instances, connections } = part;
  const relevantInstances = instances.filter((ins) => selected.includes(ins.id));

  const relevantConnections = connections.filter(({ from, to }) => {
    return selected.indexOf(from.insId) !== -1 || selected.indexOf(to.insId) !== -1;
  });

  if (!relevantInstances.length) {
    throw new Error("grouped without selections");
  }

  const { groupedPart, renamedInputs, renamedOutputs } = await createGroup(
    relevantInstances,
    relevantConnections,
    partName,
    prompt
  );
  const midPos = relevantInstances.reduce((p, c) => {
    return middlePos(c.pos, p);
    // return { x: (c.pos.x + p.x) / 2, y: (c.pos.y + p.y) / 2 };
  }, instances[0].pos);
  const newInstance = type === 'ref' ? partInstance(`${groupedPart.id}-ins`, groupedPart.id, {}, midPos) : inlinePartInstance(`${groupedPart.id}-ins`, groupedPart, {}, midPos);

  // replace relevant parts with new part
  const newInstancesArr = instances.filter((ins) => {
    return selected.indexOf(ins.id) === -1;
  });

  const newConnections = connections
    .map((conn) => {
      // refactor old connections to new ones

      const fromKey = `${conn.from.insId}.${conn.from.pinId}`;
      const toKey = `${conn.to.insId}.${conn.to.pinId}`;

      if (renamedInputs[toKey]) {
        return {
          ...conn,
          to: {
            insId: newInstance.id,
            pinId: renamedInputs[toKey],
          },
        } as ConnectionData;
      } else if (renamedOutputs[fromKey]) {
        return {
          ...conn,
          from: {
            insId: newInstance.id,
            pinId: renamedOutputs[fromKey],
          },
        } as ConnectionData;
      } else {
        return conn;
      }
    })
    .filter((conn) => {
      // remove any connection related to the old one
      return selected.indexOf(conn.from.insId) === -1 && selected.indexOf(conn.to.insId) === -1;
    });

  return {
    newPart: groupedPart,
    currentPart: produce(part, (draft) => {
      draft.instances = [...newInstancesArr, newInstance];
      draft.connections = newConnections;
    }),
  };
};
