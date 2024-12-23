export * from "./common";
import { Pos, OMap } from "./common";
import { FlydeFlow } from "./flow-schema";
import {
  VisualNode,
  CustomNode,
  InputPinsConfig,
  Node,
  NodeDefinition,
  NodeOrMacroDefinition,
  MacroNodeDefinition,
} from "./node";

export * from "./connect";
export * from "./execute";
export * from "./simplified-execute";
export * from "./node";
export * from "./node/get-node-with-dependencies";
export * from "./flow-schema";

export * from "./improved-macros/improved-macros";

export interface InstanceViewData {
  id: string;
  nodeIdOrGroup: string | VisualNode;
  pos: Pos;
  visibleOptionalInputs?: string[];
  inputConfig: InputPinsConfig;
}

export type NodesCollection = OMap<Node>;

export type NodesDefCollection = OMap<NodeDefinition>;

export type MacrosDefCollection = OMap<MacroNodeDefinition<any>>;

export type CustomNodesCollection = OMap<CustomNode>;

export interface NodeLibraryGroup {
  title: string;
  nodes: NodeOrMacroDefinition[];
}

export interface NodeLibraryData {
  groups: NodeLibraryGroup[];
}

export type ImportablesResult = {
  importables: Record<string, NodesDefCollection>;
  errors: { path: string; message: string }[];
};

export type ImportableMacrosResult = {
  importableMacros: Record<string, MacrosDefCollection>;
  errors: { path: string; message: string }[];
};

export interface FlowJob {
  flow: FlydeFlow;
  id: string;
}
