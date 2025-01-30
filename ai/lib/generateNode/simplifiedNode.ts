import { THIS_INS_ID, VisualNode } from "@flyde/core";

export function simpleToVisualNode(simple: SimpleNode): VisualNode {
  const responseNode = simple.nodes.find((node) => node.nodeId === "response");
  const requestNode = simple.nodes.find((node) => node.nodeId === "request");
  // Layout nodes in a grid
  const instances = simple.nodes.flatMap((node, i) => {
    if (node.nodeId === "response" || node.nodeId === "request") {
      return [];
    }
    return {
      id: node.id,
      nodeId: `${node.nodeId}__${node.id}`,
      macroId: node.nodeId,
      macroData: node.config,
      inputConfig: {},
      pos: {
        x: node.x,
        y: node.y,
      },
    };
  });

  const connections = simple.links.map((link) => {
    const fromNodeId = simple.nodes.find(
      (node) => node.id === link.from[0]
    )?.nodeId;
    const toNodeId = simple.nodes.find(
      (node) => node.id === link.to[0]
    )?.nodeId;

    const fromId = fromNodeId === "request" ? THIS_INS_ID : link.from[0];
    const fromPinId = fromNodeId === "request" ? "request" : link.from[1];

    const toId = toNodeId === "response" ? THIS_INS_ID : link.to[0];
    const toPinId = toNodeId === "response" ? "response" : link.to[1];

    return {
      from: { insId: fromId, pinId: fromPinId },
      to: { insId: toId, pinId: toPinId },
    };
  });

  return {
    id: "generated",
    instances,
    connections,
    inputs: { request: {} },
    outputs: { response: {} },
    inputsPosition: {
      request: { x: requestNode?.x ?? 0, y: requestNode?.y ?? 0 },
    },
    outputsPosition: {
      response: { x: responseNode?.x ?? 0, y: responseNode?.y ?? 0 },
    },
  };
}

export type SimpleNode = {
  nodes: Array<{
    nodeId: string;
    id: string;
    config?: any;
    x: number;
    y: number;
  }>;
  links: Array<{
    from: [string, string];
    to: [string, string];
  }>;
};
