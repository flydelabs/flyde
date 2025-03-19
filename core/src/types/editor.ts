import {
  CodeNodeDefinition,
  MacroEditorConfigStructured,
  NodeInstance,
  VisualNode,
} from "../node";

export type EditorNodeInstance = NodeInstance & {
  node: CodeNodeDefinition & {
    editorConfig:
      | MacroEditorConfigStructured
      | {
          type: "custom";
          editorComponentBundleContent: string;
        };
  };
};

export type EditorVisualNode = Omit<VisualNode, "instances"> & {
  instances: EditorNodeInstance[];
};
