import { InputPinsConfig, Node, NodeDefinition, NodeStyle, Pos } from "..";
import { slug } from "cuid";

export interface PartInstanceConfig {
  inputConfig: InputPinsConfig;
  visibleInputs?: string[];
  visibleOutputs?: string[];
  displayName?: string;
  style?: NodeStyle;
}

export interface RefPartInstance extends PartInstanceConfig {
  id: string;
  partId: string;
  pos: Pos;
}

export interface InlinePartInstance extends PartInstanceConfig {
  id: string;
  part: Node;
  pos: Pos;
}
export type NodeInstance = RefPartInstance | InlinePartInstance;

export const partInstance = (
  id: string,
  partOrId: string,
  config?: InputPinsConfig,
  pos?: Pos
): NodeInstance => ({
  id,
  partId: partOrId,
  inputConfig: config || {},
  pos: pos || { x: 0, y: 0 },
});

export const inlinePartInstance = (
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

export const isInlinePartInstance = (
  ins: NodeInstance
): ins is InlinePartInstance => {
  return !!(ins as any).part;
};
export const isRefPartInstance = (ins: NodeInstance): ins is RefPartInstance =>
  !isInlinePartInstance(ins);

export const NodeInstance = (
  id: string,
  part: NodeDefinition,
  config?: InputPinsConfig,
  pos?: Pos
): NodeInstance => ({
  id,
  partId: part.id,
  inputConfig: config || {},
  pos: pos || { x: 0, y: 0 },
});

export const createInsId = (part: NodeDefinition) => {
  return `${part.id}-${slug()}`;
};
