import {
  VisualNode,
  middlePos,
  ConnectionData,
  createInsId,
  inlineVisualNodeInstance,
  EditorVisualNode,
} from "@flyde/core";
import produce from "immer";
import { createGroup } from "./lib/create-group";
import { PromptFn } from "./flow-editor/ports";

export const groupSelected = async (
  selected: string[],
  node: EditorVisualNode,
  nodeName: string,
  prompt: PromptFn
): Promise<{ newNode: EditorVisualNode; currentNode: EditorVisualNode }> => {
  const { instances, connections } = node;
  const relevantInstances = instances.filter((ins) =>
    selected.includes(ins.id)
  );

  const relevantConnections = connections.filter(({ from, to }) => {
    return (
      selected.indexOf(from.insId) !== -1 || selected.indexOf(to.insId) !== -1
    );
  });

  if (!relevantInstances.length) {
    throw new Error("visual without selections");
  }

  const { visualNode, renamedInputs, renamedOutputs } = await createGroup(
    relevantInstances,
    relevantConnections,
    nodeName,
    prompt
  );
  const midPos = relevantInstances.reduce((p, c) => {
    return middlePos(c.pos, p);
  }, instances[0]?.pos ?? { x: 0, y: 0 });
  const newInstance = inlineVisualNodeInstance(
    createInsId(visualNode),
    visualNode,
    {},
    midPos
  );

  // replace relevant nodes with new node
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
      return (
        selected.indexOf(conn.from.insId) === -1 &&
        selected.indexOf(conn.to.insId) === -1
      );
    });

  return {
    newNode: visualNode,
    currentNode: produce(node, (draft) => {
      draft.instances = [...newInstancesArr, { ...newInstance, node: visualNode }];
      draft.connections = newConnections;
    }),
  };
};
