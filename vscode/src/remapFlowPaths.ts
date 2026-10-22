import * as path from "path";
import { isMap, isScalar, visit, parseDocument } from "yaml";

export interface FileMove {
  oldPath: string;
  newPath: string;
}

// All moves are evaluated against the original paths, so swaps and chained
// renames in one VS Code operation are not applied twice.
export function movedPath(file: string, moves: readonly FileMove[]): string {
  const match = moves
    .filter(({ oldPath }) => {
      const relative = path.relative(oldPath, file);
      return relative === "" ||
        (!path.isAbsolute(relative) && relative !== ".." &&
          !relative.startsWith(`..${path.sep}`));
    })
    .sort((a, b) => b.oldPath.length - a.oldPath.length)[0];
  return match ? path.join(match.newPath, path.relative(match.oldPath, file)) : file;
}

/** Rebase file sources, including inline/nested nodes, without migrating a flow. */
export function remapFlowPaths(
  text: string,
  flowPath: string,
  moves: readonly FileMove[]
): string | undefined {
  const document = parseDocument(text);
  if (document.errors.length) {
    throw new Error(document.errors.map((error) => error.message).join("; "));
  }
  const newFlowPath = movedPath(flowPath, moves);
  let changed = false;
  visit(document, {
    Map(_key, node) {
      // A file source is deliberately distinguished from package and inline
      // sources: similarly named user configuration must not be rewritten.
      const source = node.get("source", true);
      if (!isMap(source) || source.get("type") !== "file") { return; }
      const data = source.get("data", true);
      if (!isScalar(data) || typeof data.value !== "string" || !data.value) { return; }
      const oldTarget = path.resolve(path.dirname(flowPath), data.value);
      const newTarget = movedPath(oldTarget, moves);
      if (oldTarget === newTarget && flowPath === newFlowPath) { return; }
      // Preserve absolute references; relative paths in .flyde files use '/'.
      let next = path.isAbsolute(data.value)
        ? newTarget
        : path.relative(path.dirname(newFlowPath), newTarget).split(path.sep).join("/");
      if (!path.isAbsolute(data.value) && !next.startsWith(".")) { next = `./${next}`; }
      if (next !== data.value) { data.value = next; changed = true; }
    },
  });
  return changed ? document.toString() : undefined;
}
