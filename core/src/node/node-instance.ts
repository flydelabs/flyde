import { InputPinsConfig, Node, NodeDefinition, NodeStyle, Pos } from "..";
import { slug } from "cuid";

export interface NodeInstanceConfig {
  inputConfig: InputPinsConfig;
  visibleInputs?: string[];
  visibleOutputs?: string[];
  displayName?: string;
  style?: NodeStyle;
}

export interface RefNodeInstance extends NodeInstanceConfig {
  id: string;
  nodeId: string;
  pos: Pos;
}

export interface InlineNodeInstance extends NodeInstanceConfig {
  id: string;
  node: Node;
  pos: Pos;
}
export type NodeInstance = RefNodeInstance | InlineNodeInstance;

export const nodeInstance = (
  id: string,
  nodeOrId: string,
  config?: InputPinsConfig,
  pos?: Pos
): NodeInstance => ({
  id,
  nodeId: nodeOrId,
  inputConfig: config || {},
  pos: pos || { x: 0, y: 0 },
});

export const inlineNodeInstance = (
  id: string,
  node: Node,
  config?: InputPinsConfig,
  pos?: Pos
): NodeInstance => ({
  id,
  node,
  inputConfig: config || {},
  pos: pos || { x: 0, y: 0 },
});

export const isInlineNodeInstance = (
  ins: NodeInstance
): ins is InlineNodeInstance => {
  return !!(ins as any).node;
};
export const isRefNodeInstance = (ins: NodeInstance): ins is RefNodeInstance =>
  !isInlineNodeInstance(ins);

export const NodeInstance = (
  id: string,
  node: NodeDefinition,
  config?: InputPinsConfig,
  pos?: Pos
): NodeInstance => ({
  id,
  nodeId: node.id,
  inputConfig: config || {},
  pos: pos || { x: 0, y: 0 },
});

export const createInsId = (node: NodeDefinition) => {
  return `${node.id}-${slug()}`;
};
