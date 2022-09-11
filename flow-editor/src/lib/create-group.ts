import { OMap, okeys, TRIGGER_PIN_ID } from "@flyde/core";
import {
  ConnectionData,
  InputPinMap,
  externalConnectionNode,
  connectionNode,
  partInput,
  connectionNodeEquals,
  GroupedPart,
} from "@flyde/core";
import { middlePos } from "../grouped-part-editor/utils";
import { rnd } from "../physics";
import { PartInstance } from "@flyde/core";

export const createGroup = (
  instances: PartInstance[],
  connections: ConnectionData[],
  name: string
) => {
  if (instances.length === 0) {
    throw new Error("cannot create group without instances");
  }

  const instanceIds = instances.map((ins) => ins.id);

  // connections that were "left out" after the grouping make great candidates for inputs of the new part

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
        arr.findIndex((existingConn) => connectionNodeEquals(existingConn.to, conn.to)) === idx
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
        arr.findIndex((existingConn) => connectionNodeEquals(existingConn.from, conn.from)) === idx
      );
    });

  let renamedInputs: OMap<string> = {};
  let renamedOutputs: OMap<string> = {};

  // if we're grouping only 2 parts (say 2 [id]), both connected to the same pin, we want only 1 input created, not 2
  // this helps making sure of it
  let usedInputs: OMap<string> = {};
  let usedOutputs: OMap<string> = {};

  const externalConnections: ConnectionData[] = [];
  // const inputIds = keys(looseInputs).map(k => k.split(".")[1]);

  const inputs = inputCandidates.reduce<InputPinMap>((p, conn) => {
    const targetKey = `${conn.to.insId}.${conn.to.pinId}`;
    const sourceKey = `${conn.from.insId}.${conn.from.pinId}`;

    const potential = conn.to.pinId;

    if (usedInputs[sourceKey]) {
      externalConnections.push({
        from: externalConnectionNode(usedInputs[sourceKey] as string),
        to: connectionNode(conn.to.insId, conn.to.pinId),
      });
      return p;
    }

    const name = p[potential]
      ? prompt(`Name this input (${potential} of ${conn.to.insId}) is already taken:`) ||
        `i${rnd()}`
      : potential;

    renamedInputs[targetKey] = name;

    usedInputs[sourceKey] = name;

    externalConnections.push({
      from: externalConnectionNode(name),
      to: connectionNode(conn.to.insId, conn.to.pinId),
    });

    return { ...p, [name]: partInput("any") };
  }, {});

  const outputs = outputCandidates.reduce<InputPinMap>((p, conn) => {
    const targetKey = `${conn.to.insId}.${conn.to.pinId}`;
    const sourceKey = `${conn.from.insId}.${conn.from.pinId}`;

    const potential = conn.from.pinId;

    if (usedOutputs[targetKey]) {
      externalConnections.push({
        from: connectionNode(conn.from.insId, conn.from.pinId),
        to: externalConnectionNode(usedOutputs[targetKey] as string),
      });
      return p;
    }

    const name = p[potential]
      ? prompt(`Name this output (${potential} of ${conn.from.insId} is already taken:`) ||
        `i${rnd()}`
      : potential;

    renamedOutputs[sourceKey] = name;

    usedOutputs[targetKey] = name;

    externalConnections.push({
      from: connectionNode(conn.from.insId, conn.from.pinId),
      to: externalConnectionNode(name),
    });

    return { ...p, [name]: partInput("any") };
  }, {});

  // replace relevant parts with new part
  const midPos = instances.reduce((p, c) => {
    return middlePos(c.pos, p);
  }, instances[0].pos);

  const internalConnections = connections.filter(
    (conn) => instanceIds.includes(conn.from.insId) && instanceIds.includes(conn.to.insId)
  );

  const groupedPart: GroupedPart = {
    id: name,
    inputs,
    outputs,
    instances,
    inputsPosition: okeys(inputs).reduce(
      (acc, curr, idx) => ({ ...acc, [curr]: { x: 0 + 100 * idx, y: 0 } }),
      {}
    ),
    outputsPosition: okeys(outputs).reduce(
      (acc, curr, idx) => ({ ...acc, [curr]: { x: 0 + 100 * idx, y: 400 } }),
      {}
    ),
    connections: [...internalConnections, ...externalConnections],
    completionOutputs: okeys(outputs)
  };

  return { groupedPart, renamedInputs, renamedOutputs };
  // const ordered = orderGroupedPart(groupedPart, 20);

  // return partInstance(`${name}-ins`, groupedPart, {}, midPos);
};
