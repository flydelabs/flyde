export * from "./common";
import { Pos, OMap } from "./common";
import {
  CustomNode,
  VisualNode,
  InputPinsConfig,
  Node,
  NodeDefinition,
  NodeOrMacroDefinition,
} from "./node";

export * from "./connect";
export * from "./execute";
export * from "./simplified-execute";
export * from "./node";
export * from "./node/get-node-with-dependencies";
export * from "./flow-schema";

export interface InstanceViewData {
  id: string;
  nodeIdOrGroup: string | VisualNode;
  pos: Pos;
  visibleOptionalInputs?: string[];
  inputConfig: InputPinsConfig;
}

export type NodesCollection = OMap<Node>;

export type NodesDefCollection = OMap<NodeDefinition>;

export type CustomNodesCollection = OMap<CustomNode>;

export interface NodeLibraryGroup {
  title: string;
  nodes: NodeOrMacroDefinition[];
}

export interface NodeLibraryData {
  groups: NodeLibraryGroup[];
}
