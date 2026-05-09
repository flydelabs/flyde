import * as path from "path";
import { FlydeFlow, NodeInstance, VisualNode } from "@flyde/core";

export type RenamePair = {
  oldPath: string;
  newPath: string;
};

export function rewriteRenamedFileReferences(
  flow: FlydeFlow,
  flowPath: string,
  renamePairs: RenamePair[]
): boolean {
  return rewriteNodeReferences(flow.node, path.dirname(flowPath), renamePairs);
}

function rewriteNodeReferences(
  node: VisualNode,
  flowDir: string,
  renamePairs: RenamePair[]
): boolean {
  let changed = false;

  for (const instance of node.instances) {
    changed = rewriteInstanceReference(instance, flowDir, renamePairs) || changed;
  }

  return changed;
}

function rewriteInstanceReference(
  instance: NodeInstance,
  flowDir: string,
  renamePairs: RenamePair[]
): boolean {
  if (!instance.source) {
    return false;
  }

  if (instance.source.type === "inline" && instance.source.data) {
    return rewriteNodeReferences(instance.source.data, flowDir, renamePairs);
  }

  if (instance.source.type !== "file" || typeof instance.source.data !== "string") {
    return false;
  }

  const existingPath = instance.source.data;
  const absoluteReference = path.isAbsolute(existingPath)
    ? path.normalize(existingPath)
    : path.resolve(flowDir, existingPath);
  const renamedReference = findRenamedPath(absoluteReference, renamePairs);

  if (!renamedReference) {
    return false;
  }

  instance.source.data = path.isAbsolute(existingPath)
    ? renamedReference
    : normalizeImportPath(path.relative(flowDir, renamedReference));

  return instance.source.data !== existingPath;
}

function findRenamedPath(
  absoluteReference: string,
  renamePairs: RenamePair[]
): string | undefined {
  for (const renamePair of renamePairs) {
    const oldPath = path.normalize(renamePair.oldPath);
    const relativeToOld = path.relative(oldPath, absoluteReference);

    if (
      relativeToOld === "" ||
      (relativeToOld &&
        !relativeToOld.startsWith("..") &&
        !path.isAbsolute(relativeToOld))
    ) {
      return path.join(path.normalize(renamePair.newPath), relativeToOld);
    }
  }
}

function normalizeImportPath(importPath: string): string {
  return importPath.split(path.sep).join("/");
}
