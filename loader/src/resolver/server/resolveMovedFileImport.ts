import { FlydeFlow, NodeInstance, VisualNode } from "@flyde/core";
import { existsSync, readdirSync, statSync } from "fs";
import { tmpdir } from "os";
import { basename, dirname, join, relative, resolve, sep } from "path";
import * as yaml from "yaml";
import { deserializeFlowByPath } from "../../serdes";
import { resolveCodeNodeDependencies } from "./serverUtils";

// Encapsulates parameters required to locate a potentially relocated file dependency.
export interface FileImportLookup {
  fullFlowPath: string;
  importPath: string;
  nodeId?: string;
  searchRoot?: string;
}

// Defines the origin and destination flow paths when rebasing nested visual node imports.
export interface FlowRebaseContext {
  sourceFlowPath: string;
  targetFlowPath: string;
}

// Represents a file or directory relocation event captured from workspace operations.
export interface RenamedPathEntry {
  oldPath: string;
  newPath: string;
}

// Supplies the active flow location and batch of renamed paths for import rewriting.
export interface FlowMoveRewriteContext {
  currentFlowPath: string;
  renamedEntries: ReadonlyArray<RenamedPathEntry>;
}

// Reports the serialized flow document and whether any file import paths were updated.
export interface FlowMoveRewriteResult {
  content: string;
  changed: boolean;
}

// Pairs a base directory with a target file path for relative import formatting.
export interface RelativePathRequest {
  fromDir: string;
  toFilePath: string;
  originalImport?: string;
}

interface ValidationScope {
  fullFlowPath: string;
  flowDir: string;
}

interface RebaseScope extends FlowRebaseContext {
  targetDir: string;
}

interface CandidateVerification {
  filePath: string;
  nodeId?: string;
}

interface RewriteTraversalState {
  currentFlowPath: string;
  previousFlowPath: string;
  renamedEntries: ReadonlyArray<RenamedPathEntry>;
  changed: boolean;
}

interface DirectoryScanCursor {
  dirPath: string;
  remainingDepth: number;
}

const IGNORED_SCAN_DIRS = new Set([
  "node_modules",
  ".git",
  "dist",
  "out",
  "build",
  ".next",
  ".turbo",
  "coverage",
]);

const PROJECT_MARKERS = [
  "package.json",
  "tsconfig.json",
  "pnpm-workspace.yaml",
  ".git",
];

const MAX_ANCESTOR_DEPTH = 5;
const MAX_SCAN_DEPTH = 6;

// Formats a relative import path using POSIX separators and preserves bare local style when applicable.
export function formatRelativeImportPath(request: RelativePathRequest): string {
  const rawRelative = relative(request.fromDir, request.toFilePath)
    .split(sep)
    .join("/");
  if (!rawRelative) {
    return ".";
  }
  const normalized = rawRelative.startsWith(".")
    ? rawRelative
    : `./${rawRelative}`;
  if (shouldPreserveBareStyle(request, normalized)) {
    return request.originalImport as string;
  }
  return normalized;
}

function shouldPreserveBareStyle(
  request: RelativePathRequest,
  normalized: string
): boolean {
  if (!request.originalImport) {
    return false;
  }
  if (request.originalImport.startsWith(".")) {
    return false;
  }
  return normalized === `./${request.originalImport}`;
}

// Resolves a local file import, recovering automatically if the flow or dependency moved.
export function resolveMovedFilePath(lookup: FileImportLookup): string {
  const flowDir = dirname(lookup.fullFlowPath);
  const directPath = resolve(flowDir, lookup.importPath);
  if (existsSync(directPath)) {
    return directPath;
  }

  const colocatedPath = join(flowDir, basename(lookup.importPath));
  if (isMatchingNodeFile({ filePath: colocatedPath, nodeId: lookup.nodeId })) {
    return colocatedPath;
  }

  const searchRoot = resolveSearchRoot(lookup);
  const hierarchyMatch = findInHierarchyShift(lookup, searchRoot);
  if (hierarchyMatch) {
    return hierarchyMatch;
  }

  const workspaceMatch = findInWorkspaceTree(lookup, searchRoot);
  return workspaceMatch ?? directPath;
}

// Rebases file-sourced child instances when loading a visual node from another folder.
export function rebaseVisualNodeFileImports(
  node: VisualNode,
  context: FlowRebaseContext
): VisualNode {
  const scope: RebaseScope = {
    sourceFlowPath: context.sourceFlowPath,
    targetFlowPath: context.targetFlowPath,
    targetDir: dirname(context.targetFlowPath),
  };
  const rebasedInstances = node.instances.map((instance) =>
    rebaseSingleInstance(instance, scope)
  );
  return { ...node, instances: rebasedInstances };
}

// Validates all file imports before execution and recovers relocated dependencies in memory.
export function validateAndRecoverFlowImports(
  flow: FlydeFlow,
  lookup: Pick<FileImportLookup, "fullFlowPath" | "searchRoot">
): FlydeFlow {
  const scope: ValidationScope = {
    fullFlowPath: lookup.fullFlowPath,
    flowDir: dirname(lookup.fullFlowPath),
  };
  const validatedNode = validateVisualNodeImports(flow.node, scope);
  return { ...flow, node: validatedNode };
}

// Rewrites relative file imports in a serialized .flyde document after file or folder moves.
export function rewriteFlowImportsAfterMove(
  flowContent: string,
  context: FlowMoveRewriteContext
): FlowMoveRewriteResult {
  const parsed = yaml.parse(flowContent);
  if (!parsed || typeof parsed !== "object") {
    return { content: flowContent, changed: false };
  }

  const previousFlowPath = mapPathByEntries({
    targetPath: context.currentFlowPath,
    entries: reverseEntries(context.renamedEntries),
  });
  const state: RewriteTraversalState = {
    currentFlowPath: context.currentFlowPath,
    previousFlowPath,
    renamedEntries: context.renamedEntries,
    changed: false,
  };

  rewriteLegacyImportsMap(parsed, state);
  rewriteVisualNodeObject(parsed.node, state);

  if (!state.changed) {
    return { content: flowContent, changed: false };
  }
  return {
    content: yaml.stringify(parsed, { aliasDuplicateObjects: false }),
    changed: true,
  };
}

function validateVisualNodeImports(
  node: VisualNode,
  scope: ValidationScope
): VisualNode {
  const instances = node.instances.map((instance) =>
    validateSingleInstance(instance, scope)
  );
  return { ...node, instances };
}

function validateSingleInstance(
  instance: NodeInstance,
  scope: ValidationScope
): NodeInstance {
  if (isInlineInstance(instance)) {
    return validateInlineInstance(instance, scope);
  }
  if (!isFileSourcedInstance(instance)) {
    return instance;
  }
  return resolveAndUpdateFileInstance(instance, scope);
}

function validateInlineInstance(
  instance: NodeInstance,
  scope: ValidationScope
): NodeInstance {
  const anyIns = instance as any;
  return {
    ...anyIns,
    source: {
      ...anyIns.source,
      data: validateVisualNodeImports(anyIns.source.data, scope),
    },
  };
}

function resolveAndUpdateFileInstance(
  instance: NodeInstance,
  scope: ValidationScope
): NodeInstance {
  const anyIns = instance as any;
  const resolvedPath = resolveMovedFilePath({
    fullFlowPath: scope.fullFlowPath,
    importPath: anyIns.source.data,
    nodeId: anyIns.nodeId,
  });
  if (!existsSync(resolvedPath)) {
    throw new Error(
      `Cannot find imported file "${anyIns.source.data}" for node "${anyIns.nodeId}" in ${scope.fullFlowPath}`
    );
  }
  const updatedData = formatRelativeImportPath({
    fromDir: scope.flowDir,
    toFilePath: resolvedPath,
    originalImport: anyIns.source.data,
  });
  return {
    ...anyIns,
    source: { ...anyIns.source, data: updatedData },
  };
}

function rebaseSingleInstance(
  instance: NodeInstance,
  scope: RebaseScope
): NodeInstance {
  if (isInlineInstance(instance)) {
    const anyIns = instance as any;
    return {
      ...anyIns,
      source: {
        ...anyIns.source,
        data: rebaseVisualNodeFileImports(anyIns.source.data, scope),
      },
    };
  }
  if (!isFileSourcedInstance(instance)) {
    return instance;
  }

  const anyIns = instance as any;
  const resolvedChildPath = resolveMovedFilePath({
    fullFlowPath: scope.sourceFlowPath,
    importPath: anyIns.source.data,
    nodeId: anyIns.nodeId,
  });
  const rebasedData = formatRelativeImportPath({
    fromDir: scope.targetDir,
    toFilePath: resolvedChildPath,
    originalImport: anyIns.source.data,
  });
  return {
    ...anyIns,
    source: { ...anyIns.source, data: rebasedData },
  };
}

function isInlineInstance(instance: any): boolean {
  return Boolean(instance?.source?.type === "inline" && instance.source.data);
}

function isFileSourcedInstance(instance: any): boolean {
  return Boolean(
    instance?.source?.type === "file" &&
      typeof instance.source.data === "string"
  );
}

function findInHierarchyShift(
  lookup: FileImportLookup,
  searchRoot: string
): string | undefined {
  const ancestors = collectAncestorDirs({
    dirPath: dirname(lookup.fullFlowPath),
    remainingDepth: MAX_ANCESTOR_DEPTH,
    stopRoot: searchRoot,
  });
  const strippedImport = stripLeadingParentSegments(lookup);

  for (const dir of ancestors) {
    const directCandidate = resolve(dir, lookup.importPath);
    if (isMatchingNodeFile({ filePath: directCandidate, nodeId: lookup.nodeId })) {
      return directCandidate;
    }
    const strippedCandidate = resolve(dir, strippedImport);
    if (
      isMatchingNodeFile({ filePath: strippedCandidate, nodeId: lookup.nodeId })
    ) {
      return strippedCandidate;
    }
  }
  return undefined;
}

function findInWorkspaceTree(
  lookup: FileImportLookup,
  searchRoot: string
): string | undefined {
  const allFiles = collectCandidateFiles({
    dirPath: searchRoot,
    remainingDepth: MAX_SCAN_DEPTH,
  });
  const currentFlowResolved = resolve(lookup.fullFlowPath);
  const targetBaseName = basename(lookup.importPath);

  const nameMatches = allFiles.filter(
    (file) =>
      file !== currentFlowResolved &&
      basename(file) === targetBaseName &&
      isMatchingNodeFile({ filePath: file, nodeId: lookup.nodeId })
  );
  if (nameMatches.length > 0) {
    return pickClosestCandidate(lookup, nameMatches);
  }
  return findNodeIdFallbackMatch(lookup, allFiles);
}

function findNodeIdFallbackMatch(
  lookup: FileImportLookup,
  allFiles: string[]
): string | undefined {
  if (!lookup.nodeId) {
    return undefined;
  }
  const currentFlowResolved = resolve(lookup.fullFlowPath);
  const expectsVisual = lookup.importPath.endsWith(".flyde");
  const matches = allFiles.filter(
    (file) =>
      file !== currentFlowResolved &&
      file.endsWith(".flyde") === expectsVisual &&
      isMatchingNodeFile({ filePath: file, nodeId: lookup.nodeId })
  );
  return matches.length > 0 ? pickClosestCandidate(lookup, matches) : undefined;
}

function pickClosestCandidate(
  lookup: FileImportLookup,
  candidates: string[]
): string {
  const fromDir = dirname(lookup.fullFlowPath);
  return [...candidates].sort((left, right) => {
    const leftSegments = relative(fromDir, left).split(sep).length;
    const rightSegments = relative(fromDir, right).split(sep).length;
    return leftSegments - rightSegments;
  })[0];
}

function isMatchingNodeFile(check: CandidateVerification): boolean {
  if (!isExistingFile(check)) {
    return false;
  }
  if (!check.nodeId) {
    return true;
  }
  if (check.filePath.endsWith(".flyde")) {
    return doesVisualFileMatchNodeId(check);
  }
  if (check.filePath.endsWith(".js") || check.filePath.endsWith(".ts")) {
    return doesCodeFileMatchNodeId(check);
  }
  return true;
}

function isExistingFile(check: CandidateVerification): boolean {
  try {
    return existsSync(check.filePath) && statSync(check.filePath).isFile();
  } catch {
    return false;
  }
}

function doesVisualFileMatchNodeId(check: CandidateVerification): boolean {
  try {
    const flow = deserializeFlowByPath(check.filePath);
    return flow.node?.id === check.nodeId;
  } catch {
    return false;
  }
}

function doesCodeFileMatchNodeId(check: CandidateVerification): boolean {
  try {
    const resolved = resolveCodeNodeDependencies(check.filePath);
    return resolved.nodes.some((entry) => entry.node.id === check.nodeId);
  } catch {
    return false;
  }
}

function resolveSearchRoot(lookup: FileImportLookup): string {
  if (lookup.searchRoot) {
    return resolve(lookup.searchRoot);
  }
  const systemTempRoot = resolve(tmpdir());
  let current = resolve(dirname(lookup.fullFlowPath));
  let fallback = current;

  for (let depth = 0; depth < MAX_ANCESTOR_DEPTH; depth++) {
    if (hasProjectMarker({ dirPath: current, remainingDepth: 0 })) {
      return current;
    }
    const parent = dirname(current);
    if (parent === current || parent === systemTempRoot) {
      return current;
    }
    fallback = parent;
    current = parent;
  }
  return fallback;
}

function hasProjectMarker(cursor: DirectoryScanCursor): boolean {
  return PROJECT_MARKERS.some((marker) =>
    existsSync(join(cursor.dirPath, marker))
  );
}

function collectAncestorDirs(
  cursor: DirectoryScanCursor & { stopRoot: string }
): string[] {
  const dirs: string[] = [];
  let current = resolve(cursor.dirPath);
  const stopRoot = resolve(cursor.stopRoot);

  for (let depth = 0; depth <= cursor.remainingDepth; depth++) {
    dirs.push(current);
    if (current === stopRoot || dirname(current) === current) {
      break;
    }
    current = dirname(current);
  }
  return dirs;
}

function stripLeadingParentSegments(lookup: FileImportLookup): string {
  const normalized = lookup.importPath.split(sep).join("/");
  const stripped = normalized.replace(/^(\.\.?\/)+/, "");
  return stripped || basename(normalized);
}

function collectCandidateFiles(cursor: DirectoryScanCursor): string[] {
  if (cursor.remainingDepth < 0 || !existsSync(cursor.dirPath)) {
    return [];
  }
  const entries = safeReadDir(cursor);
  const collected: string[] = [];

  for (const entryName of entries) {
    if (!IGNORED_SCAN_DIRS.has(entryName)) {
      appendScannedEntry(
        {
          dirPath: join(cursor.dirPath, entryName),
          remainingDepth: cursor.remainingDepth,
        },
        collected
      );
    }
  }
  return collected;
}

function appendScannedEntry(
  cursor: DirectoryScanCursor,
  collected: string[]
): void {
  try {
    const stat = statSync(cursor.dirPath);
    if (stat.isDirectory()) {
      collected.push(
        ...collectCandidateFiles({
          dirPath: cursor.dirPath,
          remainingDepth: cursor.remainingDepth - 1,
        })
      );
      return;
    }
    if (stat.isFile() && isSupportedNodeFile(cursor)) {
      collected.push(resolve(cursor.dirPath));
    }
  } catch {
    return;
  }
}

function safeReadDir(cursor: DirectoryScanCursor): string[] {
  try {
    return readdirSync(cursor.dirPath);
  } catch {
    return [];
  }
}

function isSupportedNodeFile(cursor: DirectoryScanCursor): boolean {
  const p = cursor.dirPath;
  return p.endsWith(".flyde") || p.endsWith(".ts") || p.endsWith(".js");
}

function reverseEntries(
  entries: ReadonlyArray<RenamedPathEntry>
): RenamedPathEntry[] {
  return entries.map((entry) => ({
    oldPath: entry.newPath,
    newPath: entry.oldPath,
  }));
}

function mapPathByEntries(request: {
  targetPath: string;
  entries: ReadonlyArray<RenamedPathEntry>;
}): string {
  const resolvedTarget = resolve(request.targetPath);
  for (const entry of request.entries) {
    const oldResolved = resolve(entry.oldPath);
    const newResolved = resolve(entry.newPath);
    if (resolvedTarget === oldResolved) {
      return newResolved;
    }
    if (resolvedTarget.startsWith(`${oldResolved}${sep}`)) {
      return join(newResolved, relative(oldResolved, resolvedTarget));
    }
  }
  return resolvedTarget;
}

function rewriteLegacyImportsMap(
  parsed: any,
  state: RewriteTraversalState
): void {
  if (!parsed.imports || typeof parsed.imports !== "object") {
    return;
  }
  const updatedImports: Record<string, any> = {};
  for (const [importKey, exportedNodes] of Object.entries(parsed.imports)) {
    const nextKey = computeRewrittenImport(importKey, state);
    if (nextKey !== importKey) {
      state.changed = true;
    }
    updatedImports[nextKey] = exportedNodes;
  }
  parsed.imports = updatedImports;
}

function rewriteVisualNodeObject(
  node: any,
  state: RewriteTraversalState
): void {
  if (!node || !Array.isArray(node.instances)) {
    return;
  }
  for (const instance of node.instances) {
    rewriteInstanceObject(instance, state);
  }
}

function rewriteInstanceObject(
  instance: any,
  state: RewriteTraversalState
): void {
  if (!instance || typeof instance !== "object") {
    return;
  }
  if (isInlineInstance(instance)) {
    rewriteVisualNodeObject(instance.source.data, state);
    return;
  }
  if (instance.node && typeof instance.node === "object") {
    rewriteVisualNodeObject(instance.node, state);
  }
  if (isFileSourcedInstance(instance)) {
    updateFileInstanceSource(instance, state);
  }
}

function updateFileInstanceSource(
  instance: any,
  state: RewriteTraversalState
): void {
  const nextData = computeRewrittenImport(instance.source.data, state);
  if (nextData !== instance.source.data) {
    instance.source.data = nextData;
    state.changed = true;
  }
}

function computeRewrittenImport(
  rawImportPath: string,
  state: RewriteTraversalState
): string {
  if (!isRelativeFileReference(rawImportPath)) {
    return rawImportPath;
  }
  const originalTarget = resolve(dirname(state.previousFlowPath), rawImportPath);
  const movedTarget = mapPathByEntries({
    targetPath: originalTarget,
    entries: state.renamedEntries,
  });
  const flowMoved =
    resolve(state.previousFlowPath) !== resolve(state.currentFlowPath);
  const targetMoved = resolve(movedTarget) !== resolve(originalTarget);

  if (!flowMoved && !targetMoved) {
    return rawImportPath;
  }

  const finalTarget = selectEffectiveTarget(
    {
      fromDir: dirname(state.currentFlowPath),
      toFilePath: movedTarget,
      originalImport: rawImportPath,
    },
    originalTarget
  );
  return formatRelativeImportPath({
    fromDir: dirname(state.currentFlowPath),
    toFilePath: finalTarget,
    originalImport: rawImportPath,
  });
}

function selectEffectiveTarget(
  request: RelativePathRequest,
  originalTarget: string
): string {
  if (resolve(request.toFilePath) !== resolve(originalTarget)) {
    return request.toFilePath;
  }
  if (existsSync(originalTarget)) {
    return originalTarget;
  }
  const colocatedTarget = resolve(
    request.fromDir,
    request.originalImport ?? "."
  );
  return existsSync(colocatedTarget) ? colocatedTarget : originalTarget;
}

function isRelativeFileReference(importPath: string): boolean {
  return (
    importPath.startsWith(".") ||
    importPath.endsWith(".flyde") ||
    importPath.endsWith(".flyde.ts") ||
    importPath.endsWith(".flyde.js")
  );
}
