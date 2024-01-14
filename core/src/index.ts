export * from "./common";
import { Pos, OMap } from "./common";
import {
  CustomNode,
  VisualNode,
  InputPinsConfig,
  Node,
  NodeDefinition,
} from "./node";

export * from "./connect";
export * from "./execute";
export * from "./simplified-execute";
export * from "./node";
export * from "./node/get-node-with-dependencies";
export * from "./inline-value-to-code-node";
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
