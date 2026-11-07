import {
  AdvancedCodeNode,
  CodeNode,
  FlydeNode,
  isCodeNode,
  NodeInstance,
} from "@flyde/core";
import * as _Nodes from "@flyde/nodes/dist/all";
import { existsSync, readFileSync } from "fs";
import { join } from "path";
import { deserializeFlowByPath } from "../../serdes";
import { ReferencedNodeFinder } from "./../ReferencedNodeFinder";
import { resolveImportablePaths } from "./resolveImportablePaths";
import {
  rebaseVisualNodeFileImports,
  resolveMovedFilePath,
} from "./resolveMovedFileImport";
import { resolveCodeNodeDependencies } from "./serverUtils";

type ResolvedNodeResult = FlydeNode | (CodeNode & { sourceCode: string });
type NodeWithSource = FlydeNode & { sourcePath: string };

interface FlowNodeResolutionScope {
  fullFlowPath: string;
  instance: NodeInstance;
  sourceData: string;
}

interface ResolvedFileTarget {
  scope: FlowNodeResolutionScope;
  fullFilePath: string;
}

const LocalNodes = Object.values(_Nodes).reduce<Record<string, CodeNode>>(
  (acc, curr) => (isCodeNode(curr) ? { ...acc, [curr.id]: curr } : acc),
  {}
);

// Creates a server-side node finder capable of resolving package, inline, and relocated file nodes.
export function createServerReferencedNodeFinder(
  fullFlowPath: string
): ReferencedNodeFinder {
  return (instance: NodeInstance): ResolvedNodeResult => {
    if (!instance.source) {
      return instance as unknown as FlydeNode;
    }
    return dispatchNodeSourceResolution({
      fullFlowPath,
      instance,
      sourceData: String(instance.source.data ?? ""),
    });
  };
}

function dispatchNodeSourceResolution(
  scope: FlowNodeResolutionScope
): ResolvedNodeResult {
  const source = scope.instance.source;
  switch (source.type) {
    case "package":
      return resolvePackageNode(scope);
    case "file":
      return resolveFileSourcedNode(scope);
    case "inline":
      return source.data;
    default:
      throw new Error(`Unknown node source type: ${(source as any).type}`);
  }
}

function resolvePackageNode(
  scope: FlowNodeResolutionScope
): ResolvedNodeResult {
  const candidatePaths = getLocalOrPackagePaths(scope);
  const nodeWrapper = candidatePaths
    .flatMap((fullFilePath) =>
      loadNodesFromCandidatePath({ scope, fullFilePath })
    )
    .find((node) => node.id === scope.instance.nodeId);

  if (!nodeWrapper) {
    return resolveFallbackBuiltInNode(scope);
  }

  populatePackageEditorBundle(nodeWrapper);
  if (isCodeNode(nodeWrapper)) {
    return {
      ...nodeWrapper,
      sourceCode: readNodeFileSource(nodeWrapper),
    };
  }
  return nodeWrapper;
}

function loadNodesFromCandidatePath(
  target: ResolvedFileTarget
): NodeWithSource[] {
  if (target.fullFilePath.endsWith(".flyde")) {
    try {
      const visualNode = rebaseVisualNodeFileImports(
        deserializeFlowByPath(target.fullFilePath).node,
        {
          sourceFlowPath: target.fullFilePath,
          targetFlowPath: target.scope.fullFlowPath,
        }
      );
      return [{ ...visualNode, sourcePath: target.fullFilePath }];
    } catch {
      return [];
    }
  }
  const { nodes } = resolveCodeNodeDependencies(target.fullFilePath);
  return nodes.map((entry) => ({
    ...entry.node,
    sourcePath: target.fullFilePath,
  }));
}

function resolveFallbackBuiltInNode(
  scope: FlowNodeResolutionScope
): ResolvedNodeResult {
  if (scope.sourceData !== "@flyde/nodes") {
    throw new Error(
      `Cannot find node ${scope.instance.nodeId} in ${scope.sourceData} from ${scope.fullFlowPath}`
    );
  }

  const builtInNode = LocalNodes[scope.instance.nodeId];
  if (!builtInNode) {
    throw new Error(
      `Cannot find node ${scope.instance.nodeId} in ${scope.fullFlowPath}, even not in the internal copy of "@flyde/nodes"`
    );
  }

  const maybeAdvancedNode = builtInNode as AdvancedCodeNode<any>;
  if (maybeAdvancedNode.editorConfig?.type === "custom") {
    maybeAdvancedNode.editorConfig.editorComponentBundleContent = require(
      "@flyde/nodes/dist/bundled-config/" + scope.instance.nodeId
    );
  }

  if (isCodeNode(builtInNode)) {
    return {
      ...builtInNode,
      sourceCode: getBuiltInNodeSourceCode(scope.instance),
    };
  }
  return builtInNode as FlydeNode;
}

function resolveFileSourcedNode(
  scope: FlowNodeResolutionScope
): ResolvedNodeResult {
  const fullFilePath = resolveMovedFilePath({
    fullFlowPath: scope.fullFlowPath,
    importPath: scope.sourceData,
    nodeId: scope.instance.nodeId,
  });

  if (fullFilePath.endsWith(".flyde")) {
    return resolveVisualFileNode({ scope, fullFilePath });
  }
  return resolveCodeFileNode({ scope, fullFilePath });
}

function resolveVisualFileNode(target: ResolvedFileTarget): FlydeNode {
  const node = deserializeFlowByPath(target.fullFilePath).node;
  if (node.id !== target.scope.instance.nodeId) {
    throw new Error(
      `Node ID mismatch: expected ${target.scope.instance.nodeId} but found ${node.id} in ${target.fullFilePath}`
    );
  }
  return rebaseVisualNodeFileImports(node, {
    sourceFlowPath: target.fullFilePath,
    targetFlowPath: target.scope.fullFlowPath,
  }) as unknown as FlydeNode;
}

function resolveCodeFileNode(target: ResolvedFileTarget): ResolvedNodeResult {
  const resolved = resolveCodeNodeDependencies(target.fullFilePath);
  const matched = resolved.nodes.find(
    ({ node }) => node.id === target.scope.instance.nodeId
  );

  if (!matched) {
    throw new Error(
      `Cannot find node ${target.scope.instance.nodeId} in ${target.fullFilePath}`
    );
  }

  const wrappedNode: NodeWithSource = {
    ...matched.node,
    sourcePath: target.fullFilePath,
  };
  populateFileEditorBundle(target, matched.node as AdvancedCodeNode<any>);

  if (isCodeNode(matched.node)) {
    return {
      ...matched.node,
      sourceCode: readNodeFileSource(wrappedNode),
    };
  }
  return matched.node;
}

function hasCustomEditorBundlePath(
  node: AdvancedCodeNode<any>
): node is AdvancedCodeNode<any> & {
  editorConfig: { type: "custom"; editorComponentBundlePath: string };
} {
  const config = node.editorConfig as any;
  if (!config || config.type !== "custom") {
    return false;
  }
  return typeof config.editorComponentBundlePath === "string";
}

function populatePackageEditorBundle(nodeWrapper: NodeWithSource): void {
  const maybeAdvanced = nodeWrapper as AdvancedCodeNode<any>;
  if (!hasCustomEditorBundlePath(maybeAdvanced)) {
    return;
  }
  const bundleRelPath = maybeAdvanced.editorConfig.editorComponentBundlePath;
  try {
    const bundlePath = join(nodeWrapper.sourcePath, "..", bundleRelPath);
    maybeAdvanced.editorConfig.editorComponentBundleContent = readFileSync(
      bundlePath,
      "utf-8"
    );
  } catch {
    throw new Error(
      `Cannot read editor component bundle at ${bundleRelPath}`
    );
  }
}

function populateFileEditorBundle(
  target: ResolvedFileTarget,
  node: AdvancedCodeNode<any>
): void {
  if (!hasCustomEditorBundlePath(node)) {
    return;
  }
  const bundleRelPath = node.editorConfig.editorComponentBundlePath;
  const nearNodePath = join(target.fullFilePath, "..", bundleRelPath);
  const nearFlowPath = join(target.scope.fullFlowPath, "..", bundleRelPath);
  const resolvedBundlePath = existsSync(nearNodePath)
    ? nearNodePath
    : nearFlowPath;
  node.editorConfig.editorComponentBundleContent = readFileSync(
    resolvedBundlePath,
    "utf-8"
  );
}

function getLocalOrPackagePaths(scope: FlowNodeResolutionScope): string[] {
  const directPath = join(scope.fullFlowPath, "..", scope.sourceData);
  if (existsSync(directPath)) {
    return [directPath];
  }
  if (scope.sourceData.startsWith(".")) {
    const recoveredPath = resolveMovedFilePath({
      fullFlowPath: scope.fullFlowPath,
      importPath: scope.sourceData,
      nodeId: scope.instance.nodeId,
    });
    if (existsSync(recoveredPath)) {
      return [recoveredPath];
    }
  }
  return resolvePackageExportPaths(scope);
}

function resolvePackageExportPaths(scope: FlowNodeResolutionScope): string[] {
  try {
    return resolveImportablePaths(scope.fullFlowPath, scope.sourceData);
  } catch {
    if (scope.sourceData !== "@flyde/nodes") {
      throw new Error(
        `Cannot find module ${scope.sourceData} in ${scope.fullFlowPath}`
      );
    }
    return [];
  }
}

function readNodeFileSource(nodeWrapper: NodeWithSource): string {
  try {
    return readFileSync(nodeWrapper.sourcePath, "utf-8");
  } catch (e: any) {
    return `// Error loading source code: ${e.message}`;
  }
}

function getBuiltInNodeSourceCode(instance: NodeInstance): string {
  try {
    const nodePath = require.resolve(`@flyde/nodes/dist/${instance.nodeId}`);
    return readFileSync(nodePath, "utf-8");
  } catch (e: any) {
    return getBundledNodeSourceFallback(instance, e);
  }
}

function getBundledNodeSourceFallback(
  instance: NodeInstance,
  error: Error
): string {
  try {
    const nodeContent = require("@flyde/nodes/dist/all")[instance.nodeId];
    return `// Bundled content\n${JSON.stringify(nodeContent, null, 2)}`;
  } catch {
    return `// Error loading nodes source code: ${error.message}`;
  }
}
