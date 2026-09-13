import { FlydeFlow, VisualNode } from "@flyde/core";
import { dirname, isAbsolute, relative, resolve, sep } from "path";

export type RenamedFile = {
  oldPath: string;
  newPath: string;
};

const normalizePath = (path: string) => path.replace(/[\\/]/g, sep);

function mapPath(
  path: string,
  renames: RenamedFile[],
  direction: "forward" | "backward"
) {
  const candidates = renames
    .map((rename) => ({
      from: normalizePath(
        direction === "forward" ? rename.oldPath : rename.newPath
      ),
      to: normalizePath(
        direction === "forward" ? rename.newPath : rename.oldPath
      ),
    }))
    .filter(({ from }) => path === from || path.startsWith(from + sep))
    .sort((a, b) => b.from.length - a.from.length);

  const match = candidates[0];
  return match ? match.to + path.slice(match.from.length) : path;
}

function toRelativePath(from: string, to: string) {
  const value = relative(from, to).split(sep).join("/");
  return value.startsWith(".") ? value : `./${value}`;
}

export function updateFlowReferencesOnRename(
  flow: FlydeFlow,
  flowPath: string,
  renames: RenamedFile[]
): boolean {
  const currentFlowPath = normalizePath(flowPath);
  const originalFlowPath = mapPath(currentFlowPath, renames, "backward");
  const flowMoved = originalFlowPath !== currentFlowPath;
  let changed = false;

  const updateNode = (node: VisualNode) => {
    for (const instance of node.instances) {
      if (instance.source?.type === "inline") {
        updateNode(instance.source.data);
        continue;
      }

      if (
        instance.source?.type !== "file" ||
        typeof instance.source.data !== "string"
      ) {
        continue;
      }

      const sourcePath = instance.source.data;
      const originalTargetPath = normalizePath(
        isAbsolute(sourcePath)
          ? sourcePath
          : resolve(dirname(originalFlowPath), sourcePath)
      );
      const movedTargetPath = mapPath(originalTargetPath, renames, "forward");

      if (!flowMoved && movedTargetPath === originalTargetPath) {
        continue;
      }

      const updatedSourcePath = toRelativePath(
        dirname(currentFlowPath),
        movedTargetPath
      );

      if (updatedSourcePath !== sourcePath) {
        instance.source.data = updatedSourcePath;
        changed = true;
      }
    }
  };

  updateNode(flow.node);
  return changed;
}
