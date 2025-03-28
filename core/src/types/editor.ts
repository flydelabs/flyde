import {
  CodeNodeDefinition,
  InternalCodeNode,
  MacroEditorConfigResolved,
  MacroEditorConfigStructured,
  NodeInstance,
  VisualNode,
} from "../node";

export type EditorCodeNodeDefinition = CodeNodeDefinition & {
  editorConfig:
  | MacroEditorConfigStructured
  | {
    type: "custom";
    editorComponentBundleContent: string;
  };
};

export type EditorNode = EditorCodeNodeDefinition | EditorVisualNode;

export type EditorNodeInstance = NodeInstance & {
  node: EditorNode;
};

export type EditorVisualNode = Omit<VisualNode, "instances"> & {
  instances: EditorNodeInstance[];
};

export function internalCodeNodeToEditorNode(internalNode: InternalCodeNode, editorConfig: MacroEditorConfigResolved, sourceCode: string): EditorNode {
  return {
    id: internalNode.id,
    inputs: internalNode.inputs,
    outputs: internalNode.outputs,
    displayName: internalNode.displayName ?? internalNode.id,
    description: internalNode.description,
    overrideNodeBodyHtml: internalNode.overrideNodeBodyHtml,
    defaultStyle: internalNode.defaultStyle,
    editorConfig: editorConfig,
    sourceCode: sourceCode,
  } as EditorCodeNodeDefinition;
}