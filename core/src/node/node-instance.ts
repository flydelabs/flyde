import {
  InputPinsConfig,
  Node,
  NodeDefinition,
  NodeStyle,
  Pos,
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

export interface CodeNodeSource {
  type: "package" | "file" | "custom";
  source: any;
}

export interface CodeNodeInstance extends NodeInstanceConfig {
  nodeId: string;
  source: CodeNodeSource;
  config: any;

  /**
   * @deprecated Use nodeId instead
   */
  macroId?: string;
  /**
   * @deprecated Use config instead
   */
  macroData?: any;
}

export interface VisualNodeSourceRef {
  type: "ref";
  source: string;
  nodeId: string;
}

export interface VisualNodeSourceInline {
  type: "inline";
  node: VisualNode;
}

export interface VisualNodeInstance extends NodeInstanceConfig {
  source: VisualNodeSourceRef | VisualNodeSourceInline;
}

/** @deprecated */
export interface RefNodeInstance extends NodeInstanceConfig {
  nodeId: string;
  source?: CodeNodeSource;
  config?: any;
}

/** @deprecated */
export interface InlineNodeInstance extends NodeInstanceConfig {
  node: VisualNode;
}

export type NodeInstance =
  | RefNodeInstance
  | InlineNodeInstance
  | CodeNodeInstance
  | VisualNodeInstance;

export type ResolvedNodeInstance = NodeInstance;

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

export const refNodeInstance = (
  id: string,
  nodeId: string,
  config?: any,
  inputConfig?: InputPinsConfig,
  pos?: Pos
): NodeInstance => ({
  id,
  nodeId,
  inputConfig: inputConfig || {},
  config: config || {},
  pos: pos || { x: 0, y: 0 },
});

export const inlineNodeInstance = (
  insId: string,
  node: Node,
  config?: InputPinsConfig,
  pos?: Pos
): NodeInstance =>
  ({
    id: insId,
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
  !!(ins as any).nodeId && !(ins as any).macroId;

export const isCodeNodeInstance = (
  ins: NodeInstance
): ins is CodeNodeInstance => {
  return !!(ins as any).nodeId && !!(ins as any).source;
};

export const isVisualNodeInstance = (
  ins: NodeInstance
): ins is VisualNodeInstance => {
  return (
    !!(ins as any).source &&
    (["ref", "inline"] as const).includes(
      (ins as VisualNodeInstance).source.type
    )
  );
};

export const createInsId = (node: NodeDefinition) => {
  return `${node.id}-${slug()}`;
};
