import * as path from "path";
import { FlydeFlow, VisualNode } from "@flyde/core";

const normalizePath = (filePath: string) => path.resolve(filePath);

const toImportPath = (fromDir: string, toFile: string) => {
  const relativePath = path.relative(fromDir, toFile).replace(/\\/g, "/");
  return relativePath.startsWith(".") ? relativePath : `./${relativePath}`;
};

const getRenamedPath = (
  sourcePath: string,
  oldPath: string,
  newPath: string
): string | undefined => {
  const normalizedSourcePath = normalizePath(sourcePath);
  const normalizedOldPath = normalizePath(oldPath);
  const relativePath = path.relative(normalizedOldPath, normalizedSourcePath);
  const isSameOrChild =
    relativePath === "" ||
    (relativePath !== ".." && !relativePath.startsWith(`..${path.sep}`));

  return isSameOrChild
    ? path.join(normalizePath(newPath), relativePath)
    : undefined;
};

const updateNodeImportPathReferences = (
  node: VisualNode,
  flowPath: string,
  oldPath: string,
  newPath: string
): boolean => {
  let didUpdate = false;
  const flowDir = path.dirname(flowPath);

  for (const instance of node.instances) {
    const source = instance.source;

    if (source?.type === "file") {
      const sourcePath = normalizePath(path.resolve(flowDir, source.data));
      const renamedPath = getRenamedPath(sourcePath, oldPath, newPath);

      if (renamedPath) {
        source.data = toImportPath(flowDir, renamedPath);
        didUpdate = true;
      }
    } else if (source?.type === "inline") {
      didUpdate =
        updateNodeImportPathReferences(
          source.data,
          flowPath,
          oldPath,
          newPath
        ) || didUpdate;
    }
  }

  return didUpdate;
};

export function updateFlowImportsAfterRename(
  flow: FlydeFlow,
  flowPath: string,
  oldPath: string,
  newPath: string
): boolean {
  return updateNodeImportPathReferences(flow.node, flowPath, oldPath, newPath);
}
