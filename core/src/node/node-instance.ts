import {
  InputPinsConfig,
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
  data: any;
}

export interface CodeNodeInstance extends NodeInstanceConfig {
  type: "code";
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
  type: "package" | "file" | "custom";
  data: string;
}

export interface VisualNodeSourceInline {
  type: "inline";
  data: VisualNode;
}

export type VisualNodeSource = VisualNodeSourceRef | VisualNodeSourceInline;

export interface VisualNodeInstance extends NodeInstanceConfig {
  type: "visual";
  nodeId: string;
  source: VisualNodeSource;
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

export type NodeInstance = CodeNodeInstance | VisualNodeInstance;

export type ResolvedNodeInstance = NodeInstance;

export function codeNodeInstance(
  id: string,
  nodeId: string,
  source: CodeNodeSource,
  config?: any,
  inputConfig?: InputPinsConfig,
  pos?: Pos
): CodeNodeInstance {
  return {
    id,
    type: "code",
    nodeId,
    source,
    inputConfig: inputConfig ?? {},
    config: config ?? {},
    pos: pos ?? { x: 0, y: 0 },
  };
}

export function visualNodeInstance(
  id: string,
  nodeId: string,
  source: VisualNodeSource,
  inputConfig?: InputPinsConfig,
  pos?: Pos
): VisualNodeInstance {
  return {
    id,
    type: "visual",
    nodeId,
    source,
    inputConfig: inputConfig ?? {},
    pos: pos ?? { x: 0, y: 0 },
  };
}

export const isCodeNodeInstance = (
  ins: NodeInstance
): ins is CodeNodeInstance => {
  return (
    !!(ins as any).nodeId &&
    !!(ins as any).source &&
    (ins as CodeNodeInstance).type === "code"
  );
};

export const isVisualNodeInstance = (
  ins: NodeInstance
): ins is VisualNodeInstance => {
  return !!(ins as any).source && (ins as VisualNodeInstance).type === "visual";
};

export const createInsId = (node: NodeDefinition) => {
  return `${node.id}-${slug()}`;
};
