import * as path from "path";
import { FlydeFlow } from "@flyde/core";

export type FileMove = {
  oldPath: string;
  newPath: string;
};

const normalizePath = (filePath: string) => path.resolve(filePath);

const isSameOrInside = (candidate: string, target: string) => {
  const normalizedCandidate = normalizePath(candidate);
  const normalizedTarget = normalizePath(target);
  const relative = path.relative(normalizedTarget, normalizedCandidate);

  return (
    relative === "" ||
    (!!relative &&
      !relative.startsWith("..") &&
      !path.isAbsolute(relative))
  );
};

const getMovedPath = (candidate: string, moves: FileMove[]) => {
  for (const move of moves) {
    if (isSameOrInside(candidate, move.oldPath)) {
      const relativeToMoveRoot = path.relative(move.oldPath, candidate);
      return path.join(move.newPath, relativeToMoveRoot);
    }
  }
};

const getPreviousPath = (candidate: string, moves: FileMove[]) => {
  for (const move of moves) {
    if (isSameOrInside(candidate, move.newPath)) {
      const relativeToMoveRoot = path.relative(move.newPath, candidate);
      return path.join(move.oldPath, relativeToMoveRoot);
    }
  }
};

const toFlowImportPath = (fromDir: string, targetPath: string) => {
  let relativePath = path.relative(fromDir, targetPath).replace(/\\/g, "/");

  if (!relativePath.startsWith(".")) {
    relativePath = `./${relativePath}`;
  }

  return relativePath;
};

export function updateMovedFlydeImportPaths(
  flow: FlydeFlow,
  flowPath: string,
  moves: FileMove[]
) {
  const previousFlowPath = getPreviousPath(flowPath, moves) ?? flowPath;
  const previousFlowDir = path.dirname(previousFlowPath);
  const flowDir = path.dirname(flowPath);
  let changed = false;

  for (const instance of flow.node.instances) {
    if (instance.source?.type !== "file") {
      continue;
    }

    const sourcePath = instance.source.data;
    if (typeof sourcePath !== "string") {
      continue;
    }

    const absoluteSourcePath = path.resolve(previousFlowDir, sourcePath);
    const movedPath = getMovedPath(absoluteSourcePath, moves);
    const nextSourcePath = movedPath ?? absoluteSourcePath;
    const nextImportPath = toFlowImportPath(flowDir, nextSourcePath);

    if (nextImportPath === sourcePath) {
      continue;
    }

    instance.source.data = nextImportPath;
    changed = true;
  }

  if (flow.imports) {
    for (const [importPath, importedIds] of Object.entries(flow.imports)) {
      const absoluteImportPath = path.resolve(previousFlowDir, importPath);
      const movedPath = getMovedPath(absoluteImportPath, moves);
      const nextImportPath = toFlowImportPath(
        flowDir,
        movedPath ?? absoluteImportPath
      );

      if (nextImportPath === importPath) {
        continue;
      }

      delete flow.imports[importPath];
      flow.imports[nextImportPath] = importedIds;
      changed = true;
    }
  }

  return changed;
}
