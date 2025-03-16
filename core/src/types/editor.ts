import {
  CodeNodeDefinition,
  MacroEditorConfigResolved,
  NodeInstance,
  VisualNode,
} from "../node";

export type EditorNodeInstance = NodeInstance & {
  node: CodeNodeDefinition & {
    editorConfig: MacroEditorConfigResolved;
  };
};

export type EditorVisualNode = Omit<VisualNode, "instances"> & {
  instances: EditorNodeInstance[];
};
