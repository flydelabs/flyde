import {
  CodeNodeInstance,
  EditorNodeInstance,
  isVisualNode,
  processImprovedMacro,
  processMacroNodeInstance,
} from "@flyde/core";
import { ReferencedNodeFinder } from "./ReferencedNodeFinder";
import { existsSync, readFileSync } from "fs";

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
      style: { ...instance.style, icon: "fa-object-group" },
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


  const editorInstance = {
    id: instance.id,
    config: instance.config,
    nodeId: instance.nodeId,
    inputConfig: instance.inputConfig,
    pos: instance.pos,
    style: instance.style,
    type: instance.type,
    source: instance.source,
    node: {
      id: processedInstance.id,
      inputs: processedInstance.inputs,
      outputs: processedInstance.outputs,
      displayName: processedInstance.displayName ?? processedInstance.id,
      description: processedInstance.description,
      overrideNodeBodyHtml: processedInstance.overrideNodeBodyHtml,
      defaultStyle: processedInstance.defaultStyle,
      editorConfig: macro.editorConfig,
    },
  } as EditorNodeInstance;

  return editorInstance;
}
