import {
  FlydeFlow,
  isInlineVisualNodeInstance,
  isVisualNode,
  NodeInstance,
  VisualNode,
} from "@flyde/core";
import { existsSync } from "fs";
import * as glob from "glob";
import { basename, dirname, join, relative, resolve, sep } from "path";
import * as yaml from "yaml";
import findRoot = require("find-root");
import { deserializeFlowByPath, serializeFlow } from "../../serdes";
import { isCodeNodePath, resolveCodeNodeDependencies } from "./serverUtils";

export interface FileMove {
  oldPath: string;
  newPath: string;
}

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

  return needsDotPrefix && !rel.startsWith(".") ? `./${rel}` : rel;
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
      nextInstance = {
        ...nextInstance,
        source: {
          ...nextInstance.source,
          data: formatRelativeImportPath(
            toDir,
            resolvedTarget,
            nextInstance.source.data
          ),
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

function candidateDefinesNode(candidatePath: string, nodeId?: string): boolean {
  if (!nodeId) {
    return true;
  }

  try {
    if (candidatePath.endsWith(".flyde")) {
      return deserializeFlowByPath(candidatePath).node.id === nodeId;
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
    return resolve(flowDir, "../..");
  }
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
  const searchRoot = getSearchRoot(fullFlowPath);
  const candidates = glob
    .sync(`**/${targetFileName}`, {
      cwd: searchRoot,
      ignore: ["**/node_modules/**", "**/.git/**", "**/dist/**", "**/out/**"],
      absolute: true,
    })
    .filter((filePath) => resolve(filePath) !== resolve(fullFlowPath))
    .sort(
      (a, b) =>
        relative(flowDir, a).split(sep).length -
        relative(flowDir, b).split(sep).length
    );

  for (const candidate of candidates) {
    if (candidateDefinesNode(candidate, nodeId)) {
      return candidate;
    }
  }

  return candidates.length === 1 ? candidates[0] : directPath;
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

      if (flowMoved || newTargetAbsPath !== oldTargetAbsPath) {
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

  return changed
    ? { node: { ...node, instances: updatedInstances }, changed: true }
    : { node, changed: false };
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

        if (flowMoved || newTargetAbsPath !== oldTargetAbsPath) {
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
