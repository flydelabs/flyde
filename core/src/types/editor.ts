import {
  CodeNodeDefinition,
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

export type EditorNodeInstance = NodeInstance & {
  node: EditorCodeNodeDefinition | VisualNode;
};

export type EditorVisualNode = Omit<VisualNode, "instances"> & {
  instances: EditorNodeInstance[];
};
