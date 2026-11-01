import * as path from "path";
import type { FlydeFlow, VisualNode } from "@flyde/core";

export interface FileMove {
  oldPath: string;
  newPath: string;
}

export function rebaseFlowImports(
  flow: FlydeFlow,
  filename: string,
  moves: readonly FileMove[],
): FlydeFlow | undefined {
  const orderedMoves = [...moves].sort(
    (a, b) => b.oldPath.length - a.oldPath.length,
  );
  const relocate = (filename: string) => {
    for (const move of orderedMoves) {
      const suffix = path.relative(move.oldPath, filename);
      if (
        suffix === "" ||
        (!path.isAbsolute(suffix) &&
          suffix !== ".." &&
          !suffix.startsWith(`..${path.sep}`))
      ) {
        return path.join(move.newPath, suffix);
      }
    }
    return filename;
  };
  const newFilename = relocate(filename);
  const copy = JSON.parse(JSON.stringify(flow)) as FlydeFlow;
  let changed = false;
  const rebase = (specifier: string) => {
    const target = path.resolve(path.dirname(filename), specifier);
    const newTarget = relocate(target);
    if (newTarget === target && newFilename === filename) {
      return specifier;
    }
    if (path.isAbsolute(specifier)) {
      return newTarget;
    }
    const relative = path
      .relative(path.dirname(newFilename), newTarget)
      .split(path.sep)
      .join("/");
    return relative.startsWith(".") ? relative : `./${relative}`;
  };
  const visit = (node: VisualNode) => {
    for (const instance of node.instances) {
      if (instance.source.type === "inline") {
        visit(instance.source.data);
      } else if (
        instance.source.type === "file" &&
        typeof instance.source.data === "string"
      ) {
        const next = rebase(instance.source.data);
        if (next !== instance.source.data) {
          instance.source.data = next;
          changed = true;
        }
      }
    }
  };
  visit(copy.node);
  return changed ? copy : undefined;
}
