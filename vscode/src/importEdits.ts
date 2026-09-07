import * as path from "path";
import { isMap, isScalar, isSeq, parseDocument } from "yaml";

export interface FileMove {
  oldPath: string;
  newPath: string;
}

export interface ImportEdit {
  start: number;
  end: number;
  text: string;
}

// Resolve every move against the original paths, not against earlier moves in
// the same batch (which could otherwise redirect an import twice).
function movedPath(
  file: string,
  moves: readonly FileMove[],
  paths: typeof path,
): string {
  for (const move of [...moves].sort(
    (a, b) => b.oldPath.length - a.oldPath.length,
  )) {
    const relative = paths.relative(move.oldPath, file);
    if (
      relative === "" ||
      (!paths.isAbsolute(relative) &&
        relative !== ".." &&
        !relative.startsWith(`..${paths.sep}`))
    ) {
      return paths.join(move.newPath, relative);
    }
  }
  return file;
}

/** Rewrite only import scalars, preserving comments, formatting, and unsaved edits. */
export function getImportEdits(
  text: string,
  file: string,
  moves: readonly FileMove[],
  paths: typeof path = path,
): ImportEdit[] {
  const document = parseDocument(text);
  if (document.errors.length) {
    throw new Error(document.errors[0].message);
  }
  const edits: ImportEdit[] = [];
  const destination = movedPath(file, moves, paths);

  function rewrite(value: unknown): void {
    if (!isScalar(value) || typeof value.value !== "string" || !value.range) {
      return;
    }
    const original = value.value;
    if (
      !original.startsWith("./") &&
      !original.startsWith("../") &&
      !original.startsWith(".\\") &&
      !original.startsWith("..\\") &&
      !paths.isAbsolute(original)
    ) {
      return;
    }
    const target = paths.resolve(paths.dirname(file), original);
    const newTarget = movedPath(target, moves, paths);
    if (destination === file && target === newTarget) {
      return;
    }
    let updated = paths.isAbsolute(original)
      ? newTarget
      : paths.relative(paths.dirname(destination), newTarget);
    updated = updated.split(paths.sep).join("/");
    if (!paths.isAbsolute(updated) && !updated.startsWith("../")) {
      updated = `./${updated}`;
    }
    if (updated !== original) {
      edits.push({
        start: value.range[0],
        end: value.range[1],
        text: JSON.stringify(updated),
      });
    }
  }

  function visitNode(node: unknown): void {
    if (!isMap(node)) {
      return;
    }
    const instances = node.get("instances", true);
    if (!isSeq(instances)) {
      return;
    }
    for (const instance of instances.items) {
      if (!isMap(instance)) {
        continue;
      }
      const source = instance.get("source", true);
      if (isMap(source)) {
        if (source.get("type") === "file") {
          rewrite(source.get("data", true));
        } else if (source.get("type") === "inline") {
          visitNode(source.get("data", true));
        }
      }
      // Older flows keep inline nodes directly on the instance.
      visitNode(instance.get("node", true));
    }
  }

  if (isMap(document.contents)) {
    visitNode(document.contents.get("node", true));
    const imports = document.contents.get("imports", true);
    if (isMap(imports)) {
      for (const entry of imports.items) {
        rewrite(entry.key);
      }
    }
  }
  return edits;
}
