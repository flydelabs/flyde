import {
  CodeNodeInstance,
  EditorNodeInstance,
  isVisualNode,
  MacroEditorConfigResolved,
  processImprovedMacro,
  processMacroNodeInstance,
  replaceInputsInValue,
} from "@flyde/core";
import { findReferencedNode, NodeWithSourcePath } from "./find-referenced-node";
import { readFileSync, existsSync } from "fs";
import { join, dirname, resolve } from "path";
import * as fs from "fs";

export function resolveEditorInstance(
  instance: CodeNodeInstance,
  fullFlowPath: string
): EditorNodeInstance {
  const node = findReferencedNode(instance, fullFlowPath);

  if (!node) {
    throw new Error(`Could not find node definition for ${instance.nodeId}`);
  }

  if (isVisualNode(node)) {
    throw new Error(`Node ${node.id} is a visual node and cannot be resolved`);
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

    // If still not found and it's from stdlib or marked as a stdlib component
    if (
      !bundleContent &&
      (nodeSourcePath === "@flyde/stdlib" || isStdlibComponent(node.id))
    ) {
      const stdlibBundlePath = findStdlibComponentPath(node.id, fullFlowPath);
      if (stdlibBundlePath && existsSync(stdlibBundlePath)) {
        bundlePath = stdlibBundlePath;
        bundleContent = readFileSync(bundlePath, "utf-8");
      }
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

// Helper function to check if a node is from the stdlib
function isStdlibComponent(nodeId: string): boolean {
  const stdlibComponents = [
    "InlineValue",
    "CodeExpression",
    "Conditional",
    "Switch",
    "Collect",
    "Note",
  ];
  return stdlibComponents.includes(nodeId);
}

// Helper function to locate stdlib component bundle paths
function findStdlibComponentPath(
  nodeId: string,
  fullFlowPath: string
): string | null {
  // Common locations where @flyde/stdlib might be installed
  const possibleStdlibRoots = [
    // From the flow's node_modules
    join(dirname(fullFlowPath), "node_modules", "@flyde", "stdlib"),
    // From the project root's node_modules
    join(getProjectRoot(fullFlowPath), "node_modules", "@flyde", "stdlib"),
    // From the resolver's node_modules (for monorepo setups)
    join(__dirname, "..", "..", "..", "node_modules", "@flyde", "stdlib"),
    // For local development in the flyde monorepo
    join(__dirname, "..", "..", "..", "..", "stdlib"),
  ];

  for (const root of possibleStdlibRoots) {
    const bundlePath = join(root, "dist", "ui", `${nodeId}.js`);
    if (existsSync(bundlePath)) {
      return bundlePath;
    }
  }

  return null;
}

// Helper to find the project root (directory containing package.json)
function getProjectRoot(startPath: string): string {
  let currentPath = startPath;
  while (currentPath !== "/") {
    if (existsSync(join(currentPath, "package.json"))) {
      return currentPath;
    }
    currentPath = dirname(currentPath);
  }
  return dirname(startPath); // Fallback to parent of startPath
}
