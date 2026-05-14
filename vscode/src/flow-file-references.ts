import path = require("path");
import { deserializeFlow, serializeFlow } from "@flyde/loader/dist/server";
import type { FlydeFlow, VisualNode } from "@flyde/core";

export interface FileMove {
  oldPath: string;
  newPath: string;
}

export interface FlowReferenceUpdateResult {
  changed: boolean;
  contents: string;
}

const normalizeForCompare = (filePath: string) => {
  const resolved = path.resolve(filePath);
  return process.platform === "win32" ? resolved.toLowerCase() : resolved;
};

const isSameOrInsidePath = (candidate: string, parent: string) => {
  const normalizedCandidate = normalizeForCompare(candidate);
  const normalizedParent = normalizeForCompare(parent);

  return (
    normalizedCandidate === normalizedParent ||
    normalizedCandidate.startsWith(`${normalizedParent}${path.sep}`)
  );
};

const applyMoves = (filePath: string, moves: FileMove[]) => {
  const sortedMoves = [...moves].sort(
    (a, b) => b.oldPath.length - a.oldPath.length
  );

  for (const move of sortedMoves) {
    if (isSameOrInsidePath(filePath, move.oldPath)) {
      const relativeFromMovedRoot = path.relative(move.oldPath, filePath);
      return path.resolve(move.newPath, relativeFromMovedRoot);
    }
  }

  return filePath;
};

const reverseApplyMoves = (filePath: string, moves: FileMove[]) => {
  const sortedMoves = [...moves].sort(
    (a, b) => b.newPath.length - a.newPath.length
  );

  for (const move of sortedMoves) {
    if (isSameOrInsidePath(filePath, move.newPath)) {
      const relativeFromMovedRoot = path.relative(move.newPath, filePath);
      return path.resolve(move.oldPath, relativeFromMovedRoot);
    }
  }

  return filePath;
};

const resolveSourcePath = (flowPath: string, sourcePath: string) => {
  return path.isAbsolute(sourcePath)
    ? path.resolve(sourcePath)
    : path.resolve(path.dirname(flowPath), sourcePath);
};

const toFlowRelativePath = (flowPath: string, targetPath: string) => {
  const relativePath = path
    .relative(path.dirname(flowPath), targetPath)
    .replace(/\\/g, "/");

  if (relativePath === "") {
    return `./${path.basename(targetPath)}`;
  }

  return relativePath.startsWith(".") ? relativePath : `./${relativePath}`;
};

const updateVisualNodeReferences = (
  node: VisualNode,
  previousFlowPath: string,
  currentFlowPath: string,
  moves: FileMove[]
): boolean => {
  let changed = false;

  for (const instance of node.instances) {
    if (
      instance.source?.type === "file" &&
      typeof instance.source.data === "string"
    ) {
      const previousTargetPath = resolveSourcePath(
        previousFlowPath,
        instance.source.data
      );
      const currentTargetPath = applyMoves(previousTargetPath, moves);
      const rebasedSourcePath = toFlowRelativePath(
        currentFlowPath,
        currentTargetPath
      );

      if (rebasedSourcePath !== instance.source.data) {
        instance.source.data = rebasedSourcePath;
        changed = true;
      }
    }

    if (
      instance.source?.type === "inline" &&
      instance.source.data &&
      Array.isArray(instance.source.data.instances)
    ) {
      changed =
        updateVisualNodeReferences(
          instance.source.data as VisualNode,
          previousFlowPath,
          currentFlowPath,
          moves
        ) || changed;
    }
  }

  return changed;
};

export function updateFlowFileReferencesForMoves(
  flowContents: string,
  currentFlowPath: string,
  moves: FileMove[]
): FlowReferenceUpdateResult {
  const previousFlowPath = reverseApplyMoves(currentFlowPath, moves);
  const flow: FlydeFlow = deserializeFlow(flowContents, currentFlowPath);
  const changed = updateVisualNodeReferences(
    flow.node,
    previousFlowPath,
    currentFlowPath,
    moves
  );

  return {
    changed,
    contents: changed ? serializeFlow(flow) : flowContents,
  };
}
