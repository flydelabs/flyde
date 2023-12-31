import {
  InputPinsConfig,
  Node,
  NodeDefinition,
  NodeStyle,
  Pos,
  ResolvedVisualNode,
  VisualNode,
} from "..";
import { slug } from "cuid";

export interface NodeInstanceConfig {
  inputConfig: InputPinsConfig;
  visibleInputs?: string[];
  visibleOutputs?: string[];
  displayName?: string;
  style?: NodeStyle;
  id: string;
  pos: Pos;
}

export interface RefNodeInstance extends NodeInstanceConfig {
  nodeId: string;
}

export interface InlineNodeInstance extends NodeInstanceConfig {
  node: VisualNode;
}

export interface MacroNodeInstance extends NodeInstanceConfig {
  macroId: string;
  macroData: any;
}

export type NodeInstance =
  | RefNodeInstance
  | InlineNodeInstance
  | MacroNodeInstance;

export type ResolvedInlineNodeInstance = InlineNodeInstance & {
  node: ResolvedVisualNode;
};

export type ResolvedNodeInstance = RefNodeInstance | ResolvedInlineNodeInstance;

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
): NodeInstance =>
  ({
    id,
    node,
    inputConfig: config || {},
    pos: pos || { x: 0, y: 0 },
  } as InlineNodeInstance);

export const isInlineNodeInstance = (
  ins: NodeInstance
): ins is InlineNodeInstance => {
  return !!(ins as any).node;
};
export const isRefNodeInstance = (ins: NodeInstance): ins is RefNodeInstance =>
  !!(ins as any).nodeId;

export const isMacroNodeInstance = (
  ins: NodeInstance
): ins is MacroNodeInstance => !!(ins as any).macroId;

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
