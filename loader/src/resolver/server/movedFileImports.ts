import {
  FlydeFlow,
  isInlineVisualNodeInstance,
  isVisualNode,
  NodeInstance,
  VisualNode,
} from "@flyde/core";
import { existsSync, lstatSync, readdirSync } from "fs";
import { basename, dirname, join, relative, resolve, sep } from "path";
import * as yaml from "yaml";
import findRoot = require("find-root");
import { deserializeFlowByPath, serializeFlow } from "../../serdes";
import { isCodeNodePath, resolveCodeNodeDependencies } from "./serverUtils";

export interface FileMove {
  oldPath: string;
  newPath: string;
}

const IGNORED_DIRS = new Set([
  "node_modules",
  ".git",
  "dist",
  "out",
  "build",
  ".next",
  "coverage",
]);

export function formatRelativeImportPath(
  fromDir: string,
  toFilePath: string,
  originalPath?: string,
  forceDotPrefix = false
): string {
  const rel = relative(resolve(fromDir), resolve(toFilePath))
    .split(sep)
    .join("/");

  const needsDotPrefix =
    forceDotPrefix || (originalPath ? originalPath.startsWith("./") : false);

  if (needsDotPrefix && !rel.startsWith(".")) {
    return `./${rel}`;
  }

  return rel;
}

function getMovedTargetPath(
  oldTargetAbsPath: string,
  moves: FileMove[]
): string {
  const normalizedTarget = resolve(oldTargetAbsPath);

  for (const move of moves) {
    const oldAbs = resolve(move.oldPath);
    const newAbs = resolve(move.newPath);

    if (normalizedTarget === oldAbs) {
      return newAbs;
    }

    if (normalizedTarget.startsWith(oldAbs + sep)) {
      return join(newAbs, relative(oldAbs, normalizedTarget));
    }
  }

  return normalizedTarget;
}

export function rebaseVisualNodeFileSources(
  node: VisualNode,
  fromFlowPath: string,
  toFlowPath: string
): VisualNode {
  const fromDir = dirname(resolve(fromFlowPath));
  const toDir = dirname(resolve(toFlowPath));

  if (fromDir === toDir) {
    return node;
  }

  const rebasedInstances = node.instances.map((instance) => {
    let nextInstance: NodeInstance = { ...instance };

    if (
      nextInstance.source?.type === "file" &&
      typeof nextInstance.source.data === "string"
    ) {
      const resolvedTarget = resolveMovedFilePath(
        fromFlowPath,
        nextInstance.source.data,
        nextInstance.nodeId
      );
      const rebasedData = formatRelativeImportPath(
        toDir,
        resolvedTarget,
        nextInstance.source.data
      );
      nextInstance = {
        ...nextInstance,
        source: {
          ...nextInstance.source,
          data: rebasedData,
        },
      };
    } else if (isInlineVisualNodeInstance(nextInstance)) {
      nextInstance = {
        ...nextInstance,
        source: {
          ...nextInstance.source,
          data: rebaseVisualNodeFileSources(
            nextInstance.source.data,
            fromFlowPath,
            toFlowPath
          ),
        },
      };
    }

    const nestedNode = (nextInstance as any).node;
    if (nestedNode && isVisualNode(nestedNode)) {
      (nextInstance as any).node = rebaseVisualNodeFileSources(
        nestedNode,
        fromFlowPath,
        toFlowPath
      );
    }

    return nextInstance;
  });

  return {
    ...node,
    instances: rebasedInstances,
  };
}

function collectCandidateFiles(
  dir: string,
  predicate: (filePath: string, fileName: string) => boolean,
  maxDepth = 7,
  results: string[] = []
): string[] {
  if (maxDepth < 0 || !existsSync(dir)) {
    return results;
  }

  let entries: string[];
  try {
    entries = readdirSync(dir);
  } catch {
    return results;
  }

  for (const entry of entries) {
    if (IGNORED_DIRS.has(entry)) {
      continue;
    }

    const fullPath = join(dir, entry);
    let stats;
    try {
      stats = lstatSync(fullPath);
    } catch {
      continue;
    }

    if (stats.isDirectory()) {
      collectCandidateFiles(fullPath, predicate, maxDepth - 1, results);
    } else if (stats.isFile() && predicate(fullPath, entry)) {
      results.push(fullPath);
    }
  }

  return results;
}

function candidateDefinesNode(candidatePath: string, nodeId?: string): boolean {
  if (!nodeId) {
    return true;
  }

  try {
    if (candidatePath.endsWith(".flyde")) {
      const flow = deserializeFlowByPath(candidatePath);
      return flow.node.id === nodeId;
    }

    if (isCodeNodePath(candidatePath)) {
      const { nodes } = resolveCodeNodeDependencies(candidatePath);
      return nodes.some(({ node }) => node.id === nodeId);
    }
  } catch {
    return false;
  }

  return false;
}

function getSearchRoot(fullFlowPath: string): string {
  const flowDir = dirname(resolve(fullFlowPath));
  try {
    return findRoot(flowDir);
  } catch {
    let current = flowDir;
    for (let i = 0; i < 2; i++) {
      const parent = dirname(current);
      if (parent === current) {
        break;
      }
      current = parent;
    }
    return current;
  }
}

function rankByProximity(flowDir: string, candidates: string[]): string[] {
  return [...candidates].sort((a, b) => {
    const relA = relative(flowDir, a).split(sep).length;
    const relB = relative(flowDir, b).split(sep).length;
    return relA - relB;
  });
}

export function resolveMovedFilePath(
  fullFlowPath: string,
  relativeImportPath: string,
  nodeId?: string
): string {
  const flowDir = dirname(resolve(fullFlowPath));
  const directPath = join(flowDir, relativeImportPath);

  if (existsSync(directPath)) {
    return directPath;
  }

  const targetFileName = basename(relativeImportPath);
  const directDir = dirname(directPath);
  if (existsSync(directDir)) {
    try {
      const siblingMatch = readdirSync(directDir).find(
        (entry) => entry.toLowerCase() === targetFileName.toLowerCase()
      );
      if (siblingMatch) {
        const matchedSiblingPath = join(directDir, siblingMatch);
        if (existsSync(matchedSiblingPath)) {
          return matchedSiblingPath;
        }
      }
    } catch {
      // Ignore directory read errors
    }
  }

  const searchRoot = getSearchRoot(fullFlowPath);

  const sameNameCandidates = rankByProximity(
    flowDir,
    collectCandidateFiles(
      searchRoot,
      (filePath, fileName) =>
        fileName.toLowerCase() === targetFileName.toLowerCase() &&
        resolve(filePath) !== resolve(fullFlowPath)
    )
  );

  for (const candidate of sameNameCandidates) {
    if (candidateDefinesNode(candidate, nodeId)) {
      return candidate;
    }
  }

  if (sameNameCandidates.length === 1) {
    return sameNameCandidates[0];
  }

  if (nodeId) {
    const isVisualTarget = targetFileName.endsWith(".flyde");
    const nodeMatchCandidates = rankByProximity(
      flowDir,
      collectCandidateFiles(searchRoot, (filePath, fileName) => {
        if (resolve(filePath) === resolve(fullFlowPath)) {
          return false;
        }
        if (isVisualTarget) {
          return fileName.endsWith(".flyde");
        }
        return (
          fileName.endsWith(".flyde.ts") || fileName.endsWith(".flyde.js")
        );
      })
    );

    for (const candidate of nodeMatchCandidates) {
      if (candidateDefinesNode(candidate, nodeId)) {
        return candidate;
      }
    }
  }

  return directPath;
}

export function updateVisualNodeMovedFileImports(
  node: VisualNode,
  oldFlowPath: string,
  newFlowPath: string,
  moves: FileMove[]
): { node: VisualNode; changed: boolean } {
  const oldFlowDir = dirname(resolve(oldFlowPath));
  const newFlowDir = dirname(resolve(newFlowPath));
  const flowMoved = oldFlowDir !== newFlowDir;

  let changed = false;

  const updatedInstances = node.instances.map((instance) => {
    if (
      instance.source?.type === "file" &&
      typeof instance.source.data === "string"
    ) {
      const oldTargetAbsPath = resolve(oldFlowDir, instance.source.data);
      const newTargetAbsPath = getMovedTargetPath(oldTargetAbsPath, moves);
      const targetMoved = newTargetAbsPath !== oldTargetAbsPath;

      if (flowMoved || targetMoved) {
        const nextRelPath = formatRelativeImportPath(
          newFlowDir,
          newTargetAbsPath,
          instance.source.data
        );
        if (nextRelPath !== instance.source.data) {
          changed = true;
          return {
            ...instance,
            source: {
              ...instance.source,
              data: nextRelPath,
            },
          };
        }
      }
      return instance;
    }

    if (isInlineVisualNodeInstance(instance)) {
      const nestedResult = updateVisualNodeMovedFileImports(
        instance.source.data,
        oldFlowPath,
        newFlowPath,
        moves
      );
      if (nestedResult.changed) {
        changed = true;
        return {
          ...instance,
          source: {
            ...instance.source,
            data: nestedResult.node,
          },
        };
      }
    }

    return instance;
  });

  if (!changed) {
    return { node, changed: false };
  }

  return {
    node: {
      ...node,
      instances: updatedInstances,
    },
    changed: true,
  };
}

export function updateFlowImportsForMovedFiles(
  rawFlow: string,
  oldFlowPath: string,
  newFlowPath: string,
  moves: FileMove[]
): { content: string; changed: boolean } {
  if (!rawFlow.trim()) {
    return { content: rawFlow, changed: false };
  }

  const parsed = yaml.parse(rawFlow);
  if (!parsed || typeof parsed !== "object" || !parsed.node) {
    return { content: rawFlow, changed: false };
  }

  const oldFlowDir = dirname(resolve(oldFlowPath));
  const newFlowDir = dirname(resolve(newFlowPath));
  const flowMoved = oldFlowDir !== newFlowDir;

  let importsChanged = false;
  const nextImports: Record<string, string | string[]> = {};

  if (parsed.imports && typeof parsed.imports === "object") {
    for (const [importKey, importedValue] of Object.entries(parsed.imports)) {
      if (importKey.startsWith(".")) {
        const oldTargetAbsPath = resolve(oldFlowDir, importKey);
        const newTargetAbsPath = getMovedTargetPath(oldTargetAbsPath, moves);
        const targetMoved = newTargetAbsPath !== oldTargetAbsPath;

        if (flowMoved || targetMoved) {
          const nextKey = formatRelativeImportPath(
            newFlowDir,
            newTargetAbsPath,
            importKey,
            true
          );
          if (nextKey !== importKey) {
            importsChanged = true;
          }
          nextImports[nextKey] = importedValue as string | string[];
          continue;
        }
      }
      nextImports[importKey] = importedValue as string | string[];
    }
  }

  const visualResult = updateVisualNodeMovedFileImports(
    parsed.node as VisualNode,
    oldFlowPath,
    newFlowPath,
    moves
  );

  if (!importsChanged && !visualResult.changed) {
    return { content: rawFlow, changed: false };
  }

  const updatedFlow = {
    ...(parsed.imports ? { imports: nextImports } : {}),
    node: visualResult.node,
  };

  try {
    return {
      content: serializeFlow(updatedFlow as FlydeFlow),
      changed: true,
    };
  } catch {
    return {
      content: yaml.stringify(updatedFlow, { aliasDuplicateObjects: false }),
      changed: true,
    };
  }
}
