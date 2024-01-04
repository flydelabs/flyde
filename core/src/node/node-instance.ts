import {
  CodeNode,
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
  node: VisualNode | CodeNode;
}

export interface ResolvedInlineNodeInstance extends NodeInstanceConfig {
  node: ResolvedVisualNode | CodeNode;
}

export interface MacroNodeInstance extends NodeInstanceConfig {
  macroId: string;
  macroData: any;
}

export interface ResolvedMacroNodeInstance extends NodeInstanceConfig {
  nodeId: string;
  macroId: string;
  macroData: any;
}

export type NodeInstance =
  | RefNodeInstance
  | InlineNodeInstance
  | MacroNodeInstance;

export type ResolvedNodeInstance =
  | RefNodeInstance
  | ResolvedInlineNodeInstance
  | ResolvedMacroNodeInstance;

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

export const macroNodeInstance = (
  id: string,
  macroId: string,
  macroData: any,
  config?: InputPinsConfig,
  pos?: Pos
): ResolvedMacroNodeInstance =>
  ({
    id,
    macroId,
    macroData,
    inputConfig: config || {},
    nodeId: `${macroId}__${id}`, // TODO: lift this concatenation to a higher level
    pos: pos || { x: 0, y: 0 },
  } as ResolvedMacroNodeInstance);

export const isInlineNodeInstance = (
  ins: NodeInstance
): ins is InlineNodeInstance => {
  return !!(ins as any).node;
};
export const isRefNodeInstance = (ins: NodeInstance): ins is RefNodeInstance =>
  !!(ins as any).nodeId && !(ins as any).macroId;

export const isMacroNodeInstance = (
  ins: NodeInstance
): ins is MacroNodeInstance => !!(ins as any).macroId;

export const isResolvedMacroNodeInstance = (
  ins: ResolvedNodeInstance | NodeInstance
): ins is ResolvedMacroNodeInstance =>
  !!(ins as any).macroId && !!(ins as any).nodeId;

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
