import {
  CodeNodeInstance,
  EditorNodeInstance,
  isVisualNode,
  MacroEditorConfigResolved,
  processImprovedMacro,
  processMacroNodeInstance,
  replaceInputsInValue,
  VisualNode,
} from "@flyde/core";
import { findReferencedNode, NodeWithSourcePath } from "./find-referenced-node";
import { readFileSync, existsSync } from "fs";
import { join, dirname, resolve } from "path";
import * as fs from "fs";
import { resolveVisualNode } from "./resolve-visual-node";

export function resolveEditorInstance(
  instance: CodeNodeInstance,
  fullFlowPath: string
): EditorNodeInstance {
  const node = findReferencedNode(instance, fullFlowPath);

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

  let editorConfig: any = macro.editorConfig;

  // Handle custom editor component by reading the bundle file
  if (
    editorConfig.type === "custom" &&
    editorConfig.editorComponentBundlePath
  ) {
    // Try to resolve the bundle file
    let bundlePath = editorConfig.editorComponentBundlePath;
    let bundleContent = null;

    // Use the node's sourcePath
    const nodeSourcePath = node.sourcePath;
    if (nodeSourcePath && nodeSourcePath !== "@flyde/stdlib") {
      // If we have a file path for the source, resolve relative to it
      const sourceDir = dirname(nodeSourcePath);
      const resolvedPath = join(
        sourceDir,
        editorConfig.editorComponentBundlePath
      );

      if (existsSync(resolvedPath)) {
        bundlePath = resolvedPath;
        bundleContent = readFileSync(resolvedPath, "utf-8");
      }
    }

    // If not found using sourcePath, try relative to the flow file
    if (!bundleContent && fullFlowPath) {
      const flowDir = dirname(fullFlowPath);
      const resolvedPath = join(
        flowDir,
        editorConfig.editorComponentBundlePath
      );

      if (existsSync(resolvedPath)) {
        bundlePath = resolvedPath;
        bundleContent = readFileSync(resolvedPath, "utf-8");
      }
    }

    // If still not found, try as absolute path
    if (!bundleContent && existsSync(editorConfig.editorComponentBundlePath)) {
      bundlePath = editorConfig.editorComponentBundlePath;
      bundleContent = readFileSync(bundlePath, "utf-8");
    }

    if (bundleContent) {
      editorConfig = {
        type: "custom",
        editorComponentBundleContent: bundleContent,
      };
    } else {
      throw new Error(`Editor component bundle not found at ${bundlePath}. 
        The node was loaded from ${nodeSourcePath || "unknown location"}.
        Please check that the file exists and the path is correct.`);
    }
  }

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
      editorConfig,
    },
  } as EditorNodeInstance;

  return editorInstance;
}
