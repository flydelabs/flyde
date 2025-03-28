import { InputPin, OutputPin, OMap, keys, nodeOutput, pickRandom, EditorNodeInstance, EditorVisualNode } from "@flyde/core";
import {
  ConnectionData,
  externalConnectionNode,
  connectionNode,
  nodeInput,
  connectionNodeEquals,
  VisualNode,
} from "@flyde/core";
import { rnd } from "../physics";
import { PromptFn } from "..";

export const createGroup = async (
  instances: EditorNodeInstance[],
  connections: ConnectionData[],
  name: string,
  prompt: PromptFn
) => {
  if (instances.length === 0) {
    throw new Error("cannot create group without instances");
  }

  const instanceIds = instances.map((ins) => ins.id);

  // connections that were "left out" after the grouping make great candidates for inputs of the new node

  // in inputs case it means every instance that has a connection to an instance it the group but not out of it
  const inputCandidates = connections
    .filter((conn) => {
      const isSourceGrouped = instanceIds.includes(conn.from.insId);
      const isTargetGrouped = instanceIds.includes(conn.to.insId);

      return !isSourceGrouped && isTargetGrouped;
    })
    .filter((conn, idx, arr) => {
      // filter dupes
      return (
        arr.findIndex((existingConn) =>
          connectionNodeEquals(existingConn.to, conn.to)
        ) === idx
      );
    });

  // in outputs case it's vice-versa
  const outputCandidates = connections
    .filter((conn) => {
      const isSourceGrouped = instanceIds.includes(conn.from.insId);
      const isTargetGrouped = instanceIds.includes(conn.to.insId);

      return isSourceGrouped && !isTargetGrouped;
    })
    .filter((conn, idx, arr) => {
      // filter dupes
      return (
        arr.findIndex((existingConn) =>
          connectionNodeEquals(existingConn.from, conn.from)
        ) === idx
      );
    });

  let renamedInputs: OMap<string> = {};
  let renamedOutputs: OMap<string> = {};

  // if we're grouping only 2 nodes (say 2 [id]), both connected to the same pin, we want only 1 input created, not 2
  // this helps making sure of it
  let usedInputs: OMap<string> = {};
  let usedOutputs: OMap<string> = {};

  const externalConnections: ConnectionData[] = [];
  // const inputIds = keys(looseInputs).map(k => k.split(".")[1]);

  const inputs: Record<string, InputPin> = {};
  for (const conn of inputCandidates) {
    const targetKey = `${conn.to.insId}.${conn.to.pinId}`;
    const sourceKey = `${conn.from.insId}.${conn.from.pinId}`;

    const potential = conn.to.pinId;

    if (usedInputs[sourceKey]) {
      externalConnections.push({
        from: externalConnectionNode(usedInputs[sourceKey] as string),
        to: connectionNode(conn.to.insId, conn.to.pinId),
      });
      continue;
    }

    const name = inputs[potential]
      ? (await prompt(
        `Name this input (${potential} of ${conn.to.insId}) is already taken:`
      )) || `i${rnd()}`
      : potential;

    renamedInputs[targetKey] = name;

    usedInputs[sourceKey] = name;

    externalConnections.push({
      from: externalConnectionNode(name),
      to: connectionNode(conn.to.insId, conn.to.pinId),
    });

    inputs[name] = nodeInput();
  }

  const outputs: Record<string, OutputPin> = {};
  for (const conn of outputCandidates) {
    const targetKey = `${conn.to.insId}.${conn.to.pinId}`;
    const sourceKey = `${conn.from.insId}.${conn.from.pinId}`;

    const potential = conn.from.pinId;

    if (usedOutputs[targetKey]) {
      externalConnections.push({
        from: connectionNode(conn.from.insId, conn.from.pinId),
        to: externalConnectionNode(usedOutputs[targetKey] as string),
      });
      continue;
    }

    const name = outputs[potential]
      ? (await prompt(
        `Name this output (${potential} of ${conn.from.insId} is already taken:`
      )) || `i${rnd()}`
      : potential;

    renamedOutputs[sourceKey] = name;

    usedOutputs[targetKey] = name;

    externalConnections.push({
      from: connectionNode(conn.from.insId, conn.from.pinId),
      to: externalConnectionNode(name),
    });

    outputs[name] = nodeOutput();
  }

  const internalConnections = connections.filter(
    (conn) =>
      instanceIds.includes(conn.from.insId) &&
      instanceIds.includes(conn.to.insId)
  );

  const visualNode: EditorVisualNode = {
    id: name,
    inputs,
    outputs,
    instances,
    defaultStyle: {
    },
    inputsPosition: keys(inputs).reduce(
      (acc, curr, idx) => ({ ...acc, [curr]: { x: 0 + 100 * idx, y: 0 } }),
      {}
    ),
    outputsPosition: keys(outputs).reduce(
      (acc, curr, idx) => ({ ...acc, [curr]: { x: 0 + 100 * idx, y: 400 } }),
      {}
    ),
    connections: [...internalConnections, ...externalConnections],
    completionOutputs: keys(outputs),
  };

  return { visualNode, renamedInputs, renamedOutputs };
};
