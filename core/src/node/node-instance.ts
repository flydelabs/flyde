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
  part: Node;
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
  part: Node,
  config?: InputPinsConfig,
  pos?: Pos
): NodeInstance => ({
  id,
  part,
  inputConfig: config || {},
  pos: pos || { x: 0, y: 0 },
});

export const isInlineNodeInstance = (
  ins: NodeInstance
): ins is InlineNodeInstance => {
  return !!(ins as any).part;
};
export const isRefNodeInstance = (ins: NodeInstance): ins is RefNodeInstance =>
  !isInlineNodeInstance(ins);

export const NodeInstance = (
  id: string,
  part: NodeDefinition,
  config?: InputPinsConfig,
  pos?: Pos
): NodeInstance => ({
  id,
  nodeId: part.id,
  inputConfig: config || {},
  pos: pos || { x: 0, y: 0 },
});

export const createInsId = (part: NodeDefinition) => {
  return `${part.id}-${slug()}`;
};
