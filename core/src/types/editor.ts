import {
  CodeNodeDefinition,
  CodeNodeInstance,
  InternalCodeNode,
  ConfigurableEditorConfigResolved,
  ConfigurableEditorConfigStructured,
  NodeInstance,
  VisualNode,
} from "../node";

export type EditorCodeNodeDefinition = CodeNodeDefinition & {
  editorConfig:
  | ConfigurableEditorConfigStructured
  | {
    type: "custom";
    editorComponentBundleContent: string;
  };
};

export type EditorNode = EditorCodeNodeDefinition | EditorVisualNode;

export type EditorCodeNodeInstance = CodeNodeInstance & {
  node: EditorCodeNodeDefinition;
};

export type EditorNodeInstance = NodeInstance & {
  node: EditorNode;
};

export type EditorVisualNode = Omit<VisualNode, "instances"> & {
  instances: EditorNodeInstance[];
};

export interface EditorNodeParams {
  sourceCode: string;
  editorConfig: ConfigurableEditorConfigResolved;
  isTrigger: boolean;
}

export function internalCodeNodeToEditorNode(internalNode: InternalCodeNode, { editorConfig, isTrigger, sourceCode }: EditorNodeParams): EditorNode {
  return {
    id: internalNode.id,
    inputs: internalNode.inputs,
    outputs: internalNode.outputs,
    displayName: internalNode.displayName ?? internalNode.id,
    description: internalNode.description,
    overrideNodeBodyHtml: internalNode.overrideNodeBodyHtml,
    defaultStyle: internalNode.defaultStyle,
    editorConfig: editorConfig,
    icon: internalNode.icon,
    sourceCode: sourceCode,
    isTrigger
  } as EditorCodeNodeDefinition;
}