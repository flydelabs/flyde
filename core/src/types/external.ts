/**
 * A visual node is what makes Flyde special. It represents a node created visually in the editor.
 * It consists of node instances and connections. Each node instance will either refer to an imported node (by id), or include the node "inline".
 * Each connection will represent a "wire" between 2 instances, or between an instance and a main input/output pin.
 * Connecting to a main input or output is the way that a visual nodes' internal implementation can communicate with its external API.
 */

import {
  CodeNode,
  CodeNodeInstance,
  CodeNodeSource,
  EditorNodeInstance,
  EditorVisualNode,
  InputPinsConfig,
  internalCodeNodeToEditorNode,
  isInternalMacroNode,
  NodeInstance,
  processImprovedMacro,
  processMacroNodeInstance,
  VisualNodeInstance,
  VisualNodeSource,
} from "..";
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

export const isVisualNode = (p: FlydeNode): p is VisualNode => {
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

export function nodeInstance(
  insId: string,
  nodeId: string,
  source: CodeNodeSource,
  config: any = {},
  inputConfig: InputPinsConfig = {},
  pos: Pos = { x: 0, y: 0 }
): CodeNodeInstance {
  return {
    id: insId,
    nodeId,
    source,
    config,
    inputConfig,
    type: "code",
    pos,
  };
}

export function visualNodeInstance(
  insId: string,
  nodeId: string,
  source: VisualNodeSource,
  inputConfig: InputPinsConfig = {},
  pos: Pos = { x: 0, y: 0 }
): VisualNodeInstance {
  return {
    id: insId,
    nodeId,
    source,
    inputConfig,
    pos,
    type: "visual",
  };
}

export function inlineVisualNodeInstance(
  insId: string,
  node: VisualNode,
  inputConfig: InputPinsConfig = {},
  pos: Pos = { x: 0, y: 0 }
): VisualNodeInstance {
  return {
    id: insId,
    nodeId: node.id,
    source: {
      type: "inline",
      data: node,
    },
    inputConfig,
    pos,
    type: "visual",
  };
}

export type CodeNodeDefinition = Omit<InternalCodeNode, "run"> & {
  /**
   * The source code of the node, if available. Used for editing and forking nodes in the editor.
   */
  sourceCode?: string;

  /**
   * Whether this node is a trigger node.
   * If true, the node will be treated as a trigger node and will not be editable.
   * Experimental
   * @default false
   */
  isTrigger?: boolean;
};

export type FlydeNode<T = any> = VisualNode | CodeNode<T>;

export type ImportableEditorNode = {
  id: string;
  displayName: string;
  description: string;
  icon: string;
  aliases?: string[];
  editorNode: EditorNodeInstance['node']
} & (
    | { type: "code"; source: CodeNodeSource, config: any }
    | { type: "visual"; source: VisualNodeSource }
  );

export function codeNodeToImportableEditorNode(
  node: CodeNode,
  source: CodeNodeSource
): ImportableEditorNode {
  const macro = isInternalMacroNode(node) ? node : processImprovedMacro(node);
  const processedNode = processMacroNodeInstance(node.id, node, { id: 'n/a', config: macro.defaultData });
  const editorNode = internalCodeNodeToEditorNode(processedNode, { editorConfig: macro.editorConfig, isTrigger: node.isTrigger, sourceCode: node.sourceCode });
  return {
    id: node.id,
    displayName: node.menuDisplayName,
    description: node.menuDescription,
    icon: node.icon,
    aliases: node.aliases,
    type: "code",
    source,
    editorNode: { ...editorNode, icon: node.icon, aliases: node.aliases },
    config: macro.defaultData,
  };
}

export function visualNodeToImportableEditorNode(
  node: VisualNode,
  source: VisualNodeSource
): ImportableEditorNode {
  return {
    id: node.id,
    displayName: node.id,
    description: "",
    icon: "code",
    type: "visual",
    source,
    editorNode: node as EditorVisualNode,
  };
}

export interface NodeLibraryGroup {
  title: string;
  nodes: ImportableEditorNode[];
}

export interface NodeLibraryData {
  groups: NodeLibraryGroup[];
}
