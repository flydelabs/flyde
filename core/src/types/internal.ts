import { InputPinsConfig, RunNodeFunction } from "../node";
import { ConnectionData } from "./connections";
import { BaseNode } from "./core";

export interface InternalCodeNode extends BaseNode {
  /**
   * This function will run as soon as the node's inputs are satisfied.
   * It has access to the nodes inputs values, and output pins. See {@link RunNodeFunction} for more information.
   *
   */
  run: RunNodeFunction;
}

export interface InternalRefNodeInstance {
  id: string;
  nodeId: string;
  inputConfig: InputPinsConfig;
}

export interface InternalInlineNodeInstance {
  id: string;
  node: InternalVisualNode;
  inputConfig: InputPinsConfig;
}

export type InternalNodeInstance =
  | InternalRefNodeInstance
  | InternalInlineNodeInstance;

export interface InternalVisualNode extends BaseNode {
  /** the visual nodes internal node instances, either referring to other nodes by id or by value (inline) */
  instances: InternalNodeInstance[];
  /** each connection represents a "wire" between 2 different instances, or between an instance and a main input/output*/
  connections: ConnectionData[];
}

export type InternalNode = InternalCodeNode | InternalVisualNode;

export function internalNodeInstance(
  insId: string,
  nodeId: string,
  inputConfig?: InputPinsConfig
): InternalRefNodeInstance {
  return {
    id: insId,
    nodeId,
    inputConfig: inputConfig ?? {},
  };
}

export function isInternalVisualNode(
  node: InternalNode
): node is InternalVisualNode {
  return "instances" in node;
}
