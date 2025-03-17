/**
 * A visual node is what makes Flyde special. It represents a node created visually in the editor.
 * It consists of node instances and connections. Each node instance will either refer to an imported node (by id), or include the node "inline".
 * Each connection will represent a "wire" between 2 instances, or between an instance and a main input/output pin.
 * Connecting to a main input or output is the way that a visual nodes' internal implementation can communicate with its external API.
 */

import { NodeDefinition, NodeInstance } from "..";
import { OMap, Pos, testDataCreator } from "../common";
import { ConnectionData } from "./connections";
import { BaseNode } from "./core";
import { InternalCodeNode } from "./internal";

export interface VisualNode extends BaseNode {
  /** a map holding the position for each main input. Used in the editor only. */
  inputsPosition: OMap<Pos>;
  /** a map holding the position for each main output. Used in the editor only. */
  outputsPosition: OMap<Pos>;
  /** the visual nodes internal node instances, either referring to other nodes by id or by value (inline) */
  instances: NodeInstance[];
  /** each connection represents a "wire" between 2 different instances, or between an instance and a main input/output*/
  connections: ConnectionData[];
}

export const isVisualNode = (p: Node | NodeDefinition): p is VisualNode => {
  return !!(p as VisualNode).instances && !!(p as VisualNode).connections;
};

export const visualNode = testDataCreator<VisualNode>({
  id: "visual-node",
  inputs: {},
  outputs: {},
  instances: [],
  connections: [],
  outputsPosition: {},
  inputsPosition: {},
});

export type CodeNodeDefinition = Omit<InternalCodeNode, "run"> & {
  /**
   * The source code of the node, if available. Used for editing and forking nodes in the editor.
   */
  sourceCode?: string;
};
