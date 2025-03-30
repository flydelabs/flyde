import {
  CodeNodeInstance,
  EditorNodeInstance,
  internalCodeNodeToEditorNode,
  isVisualNode,
  processImprovedMacro,
  processMacroNodeInstance,
} from "@flyde/core";
import { ReferencedNodeFinder } from "./ReferencedNodeFinder";

export function resolveEditorInstance(
  instance: CodeNodeInstance,
  findReferencedNode: ReferencedNodeFinder
): EditorNodeInstance {
  const node = findReferencedNode(instance);

  if (!node) {
    throw new Error(`Could not find node definition for ${instance.nodeId}`);
  }

  if (isVisualNode(node)) {
    return {
      id: instance.id,
      config: instance.config,
      nodeId: instance.nodeId,
      inputConfig: instance.inputConfig,
      pos: instance.pos,
      style: { ...instance.style },
      type: instance.type,
      source: instance.source,
      node: { ...node, icon: "fa-object-group" },
    } as EditorNodeInstance;
  }

  const macro = processImprovedMacro(node);

  for (const key in macro.defaultData) {
    if (!instance.config[key]) {
      instance.config[key] = macro.defaultData[key];
    }
  }

  const processedInstance = processMacroNodeInstance("", macro, instance);

  const editorNode = internalCodeNodeToEditorNode(processedInstance, macro.editorConfig, node.sourceCode);

  const editorInstance = {
    id: instance.id,
    config: instance.config,
    nodeId: instance.nodeId,
    inputConfig: instance.inputConfig,
    pos: instance.pos,
    style: instance.style,
    type: instance.type,
    source: instance.source,
    node: { ...editorNode, icon: node.icon },
  };

  return editorInstance;
}
