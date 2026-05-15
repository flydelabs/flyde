import * as path from "path";

import { FlydeFlow, NodeInstance, VisualNode } from "@flyde/core";

export interface RenamePath {
  oldPath: string;
  newPath: string;
}

const normalizePath = (filePath: string) => path.resolve(filePath);

const isSameOrInside = (candidatePath: string, rootPath: string) => {
  const relativePath = path.relative(rootPath, candidatePath);

  return (
    relativePath === "" ||
    (!!relativePath &&
      !relativePath.startsWith("..") &&
      !path.isAbsolute(relativePath))
  );
};

const applyRenameMapping = (
  filePath: string,
  renames: readonly RenamePath[]
) => {
  const normalizedPath = normalizePath(filePath);
  let bestMatch: RenamePath | undefined;
  let bestMatchLength = -1;

  for (const rename of renames) {
    const oldPath = normalizePath(rename.oldPath);

    if (
      oldPath.length > bestMatchLength &&
      isSameOrInside(normalizedPath, oldPath)
    ) {
      bestMatch = rename;
      bestMatchLength = oldPath.length;
    }
  }

  if (!bestMatch) {
    return normalizedPath;
  }

  const relativeChildPath = path.relative(
    normalizePath(bestMatch.oldPath),
    normalizedPath
  );

  return path.resolve(normalizePath(bestMatch.newPath), relativeChildPath);
};

const getPathBeforeRename = (
  currentPath: string,
  renames: readonly RenamePath[]
) => {
  const reversedRenames = renames.map((rename) => ({
    oldPath: rename.newPath,
    newPath: rename.oldPath,
  }));

  return applyRenameMapping(currentPath, reversedRenames);
};

export const toFlydeFileSourcePath = (
  fromFlowPath: string,
  targetPath: string
) => {
  const relativePath = path.relative(path.dirname(fromFlowPath), targetPath);
  const normalizedRelativePath = relativePath.replace(/\\/g, "/");

  if (path.isAbsolute(relativePath)) {
    return normalizedRelativePath;
  }

  if (
    normalizedRelativePath === ".." ||
    normalizedRelativePath.startsWith("../") ||
    normalizedRelativePath.startsWith("./")
  ) {
    return normalizedRelativePath;
  }

  return `./${normalizedRelativePath}`;
};

const hasFileSource = (
  instance: NodeInstance
): instance is NodeInstance & { source: { type: "file"; data: string } } => {
  return (
    instance.source?.type === "file" && typeof instance.source.data === "string"
  );
};

const updateInstanceFileReferences = (
  instance: NodeInstance,
  previousFlowPath: string,
  currentFlowPath: string,
  renames: readonly RenamePath[]
): boolean => {
  let changed = false;

  if (hasFileSource(instance)) {
    const previousTargetPath = path.resolve(
      path.dirname(previousFlowPath),
      instance.source.data
    );
    const currentTargetPath = applyRenameMapping(previousTargetPath, renames);
    const nextSourcePath = toFlydeFileSourcePath(
      currentFlowPath,
      currentTargetPath
    );

    if (
      (previousFlowPath !== currentFlowPath ||
        previousTargetPath !== currentTargetPath) &&
      instance.source.data !== nextSourcePath
    ) {
      instance.source.data = nextSourcePath;
      changed = true;
    }
  }

  if (
    instance.source?.type === "inline" &&
    instance.source.data &&
    typeof instance.source.data === "object"
  ) {
    changed =
      updateVisualNodeFileReferences(
        instance.source.data,
        previousFlowPath,
        currentFlowPath,
        renames
      ) || changed;
  }

  return changed;
};

const updateVisualNodeFileReferences = (
  node: VisualNode,
  previousFlowPath: string,
  currentFlowPath: string,
  renames: readonly RenamePath[]
): boolean => {
  return node.instances.reduce((changed, instance) => {
    return (
      updateInstanceFileReferences(
        instance,
        previousFlowPath,
        currentFlowPath,
        renames
      ) || changed
    );
  }, false);
};

export const updateFlowFileReferences = (
  flow: FlydeFlow,
  currentFlowPath: string,
  renames: readonly RenamePath[]
): boolean => {
  const normalizedCurrentFlowPath = normalizePath(currentFlowPath);
  const previousFlowPath = getPathBeforeRename(
    normalizedCurrentFlowPath,
    renames
  );

  return updateVisualNodeFileReferences(
    flow.node,
    previousFlowPath,
    normalizedCurrentFlowPath,
    renames
  );
};
