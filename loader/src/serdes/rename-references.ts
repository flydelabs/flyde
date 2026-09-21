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

type PathApi = typeof path.posix;

function normalizeMappings(
  renames: readonly FileRename[],
  paths: PathApi
): Array<{ oldPath: string; newPath: string }> {
  return renames
    .map(({ oldPath, newPath }) => ({
      oldPath: paths.resolve(oldPath),
      newPath: paths.resolve(newPath),
    }))
    // Longest (most specific) old path wins for overlapping folder/file renames.
    .sort((a, b) => b.oldPath.length - a.oldPath.length);
}

function applyRenameMap(
  filePath: string,
  mappings: Array<{ oldPath: string; newPath: string }>,
  paths: PathApi
): string {
  for (const rename of mappings) {
    const suffix = paths.relative(rename.oldPath, filePath);
    const isDescendant =
      suffix !== ".." &&
      !suffix.startsWith(`..${paths.sep}`) &&
      !paths.isAbsolute(suffix);
    if (isDescendant) {
      return paths.resolve(rename.newPath, suffix);
    }
  }
  return filePath;
}

function toPortableRelative(fromDir: string, target: string, paths: PathApi): string {
  let next = paths.relative(fromDir, target);
  if (
    !paths.isAbsolute(next) &&
    next !== ".." &&
    !next.startsWith(`..${paths.sep}`)
  ) {
    next = `.${paths.sep}${next}`;
  }
  return next.split(paths.sep).join("/");
}

/**
 * Compute scalar-only text edits that keep `source: { type: file }` paths
 * valid after Explorer renames. Operates on the pre-rename document bytes so
 * `onWillRenameFiles` WorkspaceEdits apply at the old URI.
 */
export function getReferenceEditsForRename(
  contents: string,
  flowPath: string,
  renames: readonly FileRename[],
  paths: PathApi = path
): ReferenceTextEdit[] {
  if (renames.length === 0) {
    return [];
  }

  const document = parseDocument(contents);
  if (document.errors.length) {
    throw new Error("Invalid flow YAML");
  }

  const mappings = normalizeMappings(renames, paths);
  const oldDirectory = paths.dirname(paths.resolve(flowPath));
  const newDirectory = paths.dirname(
    applyRenameMap(paths.resolve(flowPath), mappings, paths)
  );
  const edits: ReferenceTextEdit[] = [];

  const rewriteFileSource = (source: unknown) => {
    if (!isMap(source)) {
      return;
    }

    if (source.get("type") === "inline") {
      visitVisual(source.get("data", true));
      return;
    }

    if (source.get("type") !== "file") {
      return;
    }

    const node = source.get("data", true);
    if (!isScalar(node) && !isAlias(node)) {
      return;
    }

    const scalar = isAlias(node) ? node.resolve(document) : node;
    if (!isScalar(scalar) || typeof scalar.value !== "string" || !node.range) {
      return;
    }

    const original = scalar.value;
    const target = applyRenameMap(
      paths.resolve(oldDirectory, original),
      mappings,
      paths
    );

    // Relative path still resolves after both ends move together.
    if (paths.resolve(newDirectory, original) === target) {
      return;
    }

    // Rewriting a shared anchor would mutate unrelated YAML nodes.
    if (isScalar(node) && node.anchor) {
      throw new Error("Cannot safely rewrite an anchored file reference");
    }

    const next = paths.isAbsolute(original)
      ? target.split(paths.sep).join("/")
      : toPortableRelative(newDirectory, target, paths);

    let text = JSON.stringify(next);
    if (
      isScalar(node) &&
      (node.type === "BLOCK_LITERAL" || node.type === "BLOCK_FOLDED")
    ) {
      if (node.comment) {
        text += ` #${node.comment}`;
      }
      const token = contents.slice(node.range[0], node.range[1]);
      if (token.endsWith("\n")) {
        text += token.endsWith("\r\n") ? "\r\n" : "\n";
      }
    }

    edits.push({ start: node.range[0], end: node.range[1], text });
  };

  const visitVisual = (node: unknown) => {
    if (!isMap(node)) {
      return;
    }
    const instances = node.get("instances", true);
    if (!isSeq(instances)) {
      return;
    }
    for (const instance of instances.items) {
      if (isMap(instance)) {
        rewriteFileSource(instance.get("source", true));
      }
    }
  };

  visitVisual(document.get("node", true));
  return edits;
}
