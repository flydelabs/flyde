export * from "./common";
import { Pos, OMap } from "./common";
import {
  CustomNode,
  VisualNode,
  InputPinsConfig,
  maybeGetStaticValueNodeId,
  Node,
  NodeDefinition,
} from "./node";

export * from "./connect";

export * from "./execute";
export * from "./simplified-execute";

export * from "./node";

export * from "./node/get-part-with-dependencies";

// export * from "./serdes";

export * from "./inline-value-to-code-part";

export * from "./web-project";

export * from "./flow-schema";

export type InputStaticValue = string | number | object | VisualNode;

export const isStaticValueVisualNode = (val: InputStaticValue): boolean => {
  return !!val && !!maybeGetStaticValueNodeId(`${val}`);
};

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
