import { InternalCodeNode, NodeInstance, NodeStyle, VisualNode } from "../node";

export interface EditorNodeInstance {
  id: string;
  config: any;
  nodeId: string;
  inputConfig: NodeInstance["inputConfig"];
  pos: NodeInstance["pos"];
  style: NodeInstance["style"];

  visibleInputs?: string[];
  visibleOutputs?: string[];

  node: {
    id: string;
    inputs: InternalCodeNode["inputs"];
    outputs: InternalCodeNode["outputs"];
    displayName: string;
    description?: string;
    overrideNodeBodyHtml?: string;
    defaultStyle?: NodeStyle;
  };
}

export type EditorVisualNode = Omit<VisualNode, "instances"> & {
  instances: EditorNodeInstance[];
};
