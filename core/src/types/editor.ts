import { CodeNodeDefinition, NodeInstance, VisualNode } from "../node";

export type EditorNodeInstance = NodeInstance & {
  node: CodeNodeDefinition;
};

export type EditorVisualNode = Omit<VisualNode, "instances"> & {
  instances: EditorNodeInstance[];
};
