import type { FlydeFlow, VisualNode } from "@flyde/core";
import * as path from "path";

export interface FileMove {
  oldPath: string;
  newPath: string;
}

export function movedPath(filePath: string, moves: readonly FileMove[]): string {
  const move = [...moves]
    .sort((a, b) => b.oldPath.length - a.oldPath.length)
    .find(({ oldPath }) => {
      const relative = path.relative(oldPath, filePath);
      return relative === "" || (
        relative !== ".." &&
        !relative.startsWith(`..${path.sep}`) &&
        !path.isAbsolute(relative)
      );
    });
  return move
    ? path.join(move.newPath, path.relative(move.oldPath, filePath))
    : filePath;
}

export function updateFileReferences(
  flow: FlydeFlow,
  flowPath: string,
  moves: readonly FileMove[]
): boolean {
  const newFlowPath = movedPath(flowPath, moves);
  let changed = false;

  function visit(node: VisualNode) {
    for (const instance of node.instances) {
      const source = instance.source;
      if (source?.type === "inline") {
        visit(source.data);
      } else if (source?.type === "file" && typeof source.data === "string") {
        const target = path.join(path.dirname(flowPath), source.data);
        const newTarget = movedPath(target, moves);
        const relative = path.relative(path.dirname(newFlowPath), newTarget)
          .split(path.sep).join("/");
        const newReference = relative.startsWith(".") ? relative : `./${relative}`;
        if (path.join(path.dirname(newFlowPath), source.data) !== newTarget) {
          source.data = newReference;
          changed = true;
        }
      }
    }
  }

  visit(flow.node);
  return changed;
}
