import * as path from "path";

import { FlydeFlow, NodeInstance, VisualNode } from "@flyde/core";

/**
 * Updates local node sources after a file was renamed or moved.
 *
 * File sources are stored relative to the flow containing the instance, so
 * comparing absolute paths lets the same move be handled from every flow.
 */
export function updateFileReferencesOnRename(
  flow: FlydeFlow,
  flowPath: string,
  renamedFiles: ReadonlyArray<{ oldPath: string; newPath: string }>
): boolean {
  let changed = false;

  const updateNode = (node: VisualNode) => {
    for (const instance of node.instances) {
      updateInstance(instance);
    }
  };

  const updateInstance = (instance: NodeInstance) => {
    if (instance.source.type === "inline") {
      updateNode(instance.source.data);
      return;
    }

    if (instance.source.type !== "file") {
      return;
    }

    const currentPath = path.resolve(path.dirname(flowPath), instance.source.data);
    const renamedFile = renamedFiles.find(
      ({ oldPath }) => path.normalize(oldPath) === path.normalize(currentPath)
    );

    if (!renamedFile) {
      return;
    }

    instance.source.data = path.relative(path.dirname(flowPath), renamedFile.newPath);
    changed = true;
  };

  updateNode(flow.node);
  return changed;
}
