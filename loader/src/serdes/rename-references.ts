import * as path from "path";
import { isAlias, isMap, isScalar, isSeq, parseDocument } from "yaml";

export interface FileRename {
  oldPath: string;
  newPath: string;
}

export interface ReferenceTextEdit {
  start: number;
  end: number;
  text: string;
}

/** Plans scalar-only edits against the document's pre-rename contents. */
export function getReferenceEditsForRename(
  contents: string,
  flowPath: string,
  renames: readonly FileRename[],
  paths: typeof path.posix = path
): ReferenceTextEdit[] {
  if (renames.length === 0) return [];
  const document = parseDocument(contents);
  if (document.errors.length) throw new Error("Invalid flow YAML");
  const mappings = renames
    .map(({ oldPath, newPath }) => ({
      oldPath: paths.resolve(oldPath),
      newPath: paths.resolve(newPath),
    }))
    .sort((a, b) => b.oldPath.length - a.oldPath.length);

  const relocated = (filePath: string): string => {
    for (const rename of mappings) {
      const suffix = paths.relative(rename.oldPath, filePath);
      if (
        suffix !== ".." &&
        !suffix.startsWith(`..${paths.sep}`) &&
        !paths.isAbsolute(suffix)
      ) {
        return paths.resolve(rename.newPath, suffix);
      }
    }
    return filePath;
  };

  const oldDirectory = paths.dirname(paths.resolve(flowPath));
  const newDirectory = paths.dirname(relocated(paths.resolve(flowPath)));
  const edits: ReferenceTextEdit[] = [];

  const updateSource = (source: unknown) => {
    if (!isMap(source)) return;
    if (source.get("type") === "inline") {
      visitVisualNode(source.get("data", true));
      return;
    }
    if (source.get("type") !== "file") return;
    const node = source.get("data", true);
    if (!isScalar(node) && !isAlias(node)) return;
    const scalar = isAlias(node) ? node.resolve(document) : node;
    if (!isScalar(scalar) || typeof scalar.value !== "string" || !node.range)
      return;
    const original = scalar.value;
    const target = relocated(paths.resolve(oldDirectory, original));
    // Moving both endpoints together can leave a relative reference unchanged.
    if (paths.resolve(newDirectory, original) === target) return;
    // Updating a shared anchor could also change unrelated custom-node data.
    if (isScalar(node) && node.anchor) {
      throw new Error("Cannot safely rewrite an anchored file reference");
    }
    let next = paths.isAbsolute(original)
      ? target
      : paths.relative(newDirectory, target);
    if (
      !paths.isAbsolute(next) &&
      next !== ".." &&
      !next.startsWith(`..${paths.sep}`)
    ) {
      next = `.${paths.sep}${next}`;
    }
    next = next.split(paths.sep).join("/");
    let text = JSON.stringify(next);
    if (
      isScalar(node) &&
      (node.type === "BLOCK_LITERAL" || node.type === "BLOCK_FOLDED")
    ) {
      if (node.comment) text += ` #${node.comment}`;
      const token = contents.slice(node.range[0], node.range[1]);
      if (token.endsWith("\n")) text += token.endsWith("\r\n") ? "\r\n" : "\n";
    }
    edits.push({ start: node.range[0], end: node.range[1], text });
  };

  const visitVisualNode = (node: unknown) => {
    if (!isMap(node)) return;
    const instances = node.get("instances", true);
    if (!isSeq(instances)) return;
    for (const instance of instances.items) {
      if (isMap(instance)) updateSource(instance.get("source", true));
    }
  };

  visitVisualNode(document.get("node", true));
  return edits;
}
