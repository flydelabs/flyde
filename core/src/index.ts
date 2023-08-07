export * from "./common";
import { Pos, OMap } from "./common";
import {
  CustomNode,
  VisualNode,
  InputPinsConfig,
  maybeGetStaticValuePartId,
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

export const isStaticValueVisualPart = (val: InputStaticValue): boolean => {
  return !!val && !!maybeGetStaticValuePartId(`${val}`);
};

export interface InstanceViewData {
  id: string;
  partIdOrGroup: string | VisualNode;
  pos: Pos;
  visibleOptionalInputs?: string[];
  inputConfig: InputPinsConfig;
}

export type NodesCollection = OMap<Node>;

export type NodesDefCollection = OMap<NodeDefinition>;

export type CustomPartsCollection = OMap<CustomNode>;
