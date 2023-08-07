import { NodeInstance, ConnectionData, VisualNode } from "@flyde/core";

export const getLeafInstancesOfSelection = (
  selectedInstances: NodeInstance[],
  allInstances: NodeInstance[],
  allConnections: ConnectionData[]
): NodeInstance[] => {
  const allConnected = selectedInstances.reduce<NodeInstance[]>((acc, curr) => {
    const instancesConnectedToCurr = allConnections
      .filter((conn) => conn.to.insId === curr.id)
      .map(
        (conn) =>
          allInstances.find((ins) => ins.id === conn.from.insId) as NodeInstance
      )
      .filter((ins) => !!ins);
    return [...acc, ...instancesConnectedToCurr];
  }, []);

  // find all the instances who are only connected to our dragged piece, so we can assume the intent is to drag them too
  return allConnected.filter((ins) => {
    const insConnectedIds = allConnections.filter(
      (conn) => conn.from.insId === ins.id || conn.to.insId === ins.id
    );
    return insConnectedIds.length === 1 && !selectedInstances.includes(ins); //only those who are singly connected
  });
};

export type InstanceWithConstPinMap = Map<
  string,
  Map<string, { val: any; insId: string }>
>;

export const calculateInstancesWithSingleConstPinsMap = (
  node: VisualNode,
  constSinglePinMap: Map<string, any>
): InstanceWithConstPinMap => {
  const { connections } = node;

  return connections
    .filter((conn) => {
      return constSinglePinMap.has(conn.from.insId);
    })
    .reduce((accMap, conn) => {
      const constVal = constSinglePinMap.get(conn.from.insId);
      const targetInstance = conn.to.insId;
      const pinMap = accMap.get(targetInstance) || new Map();
      pinMap.set(conn.to.pinId, { val: constVal, insId: conn.from.insId });
      accMap.set(targetInstance, pinMap);
      return accMap;
    }, new Map());
};
