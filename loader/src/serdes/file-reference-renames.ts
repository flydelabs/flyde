import { dirname, isAbsolute, relative, resolve, sep } from "path";
import { isMap, isScalar, isSeq, parseDocument } from "yaml";

export interface FileReferenceRename {
  oldPath: string;
  newPath: string;
}

export interface FileReferenceEdit {
  start: number;
  end: number;
  text: string;
}

/** Map original paths once: a rename batch is simultaneous, not a chain. */
export function renameFileReferencePath(file: string, renames: readonly FileReferenceRename[]): string {
  const rename = [...renames].sort((a, b) => b.oldPath.length - a.oldPath.length).find(({ oldPath }) => {
    const suffix = relative(oldPath, file);
    return suffix === "" || (suffix !== ".." && !suffix.startsWith(`..${sep}`) && !isAbsolute(suffix));
  });
  return rename ? resolve(rename.newPath, relative(rename.oldPath, file)) : file;
}

/** Change only file-source scalars, preserving comments and unrelated YAML. */
export function fileReferenceEditsForRenames(
  text: string,
  flowPath: string,
  renames: readonly FileReferenceRename[]
): FileReferenceEdit[] {
  const document = parseDocument(text);
  if (document.errors.length) {
    throw new Error(document.errors[0].message);
  }
  const edits: FileReferenceEdit[] = [];
  const nextFlowPath = renameFileReferencePath(flowPath, renames);

  const update = (scalar: unknown) => {
    if (!isScalar(scalar) || typeof scalar.value !== "string" || !scalar.range || scalar.anchor) {
      return;
    }
    const original = scalar.value;
    const target = resolve(dirname(flowPath), original);
    const nextTarget = renameFileReferencePath(target, renames);
    if (resolve(dirname(nextFlowPath), original) === nextTarget) {
      return;
    }
    const next = isAbsolute(original)
      ? nextTarget
      : relative(dirname(nextFlowPath), nextTarget).split(sep).join("/");
    const value = !isAbsolute(original) && original.startsWith("./") && !next.startsWith(".") ? `./${next}` : next;
    let replacement = JSON.stringify(value);
    if (scalar.type === "BLOCK_FOLDED" || scalar.type === "BLOCK_LITERAL") {
      const originalText = text.slice(scalar.range[0], scalar.range[1]);
      const header = originalText.split(/\r?\n/, 1)[0];
      const comment = header.indexOf("#");
      if (comment >= 0) { replacement += ` ${header.slice(comment)}`; }
      // Block scalar ranges consume the final newline before the next property.
      if (originalText.endsWith("\r\n")) { replacement += "\r\n"; }
      else if (originalText.endsWith("\n")) { replacement += "\n"; }
    }
    edits.push({ start: scalar.range[0], end: scalar.range[1], text: replacement });
  };

  const visitNode = (node: unknown) => {
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
      if (!isMap(source)) {
        continue;
      }
      if (source.get("type") === "file") {
        update(source.get("data", true));
      } else if (source.get("type") === "inline") {
        visitNode(source.get("data", true));
      }
    }
  };

  if (isMap(document.contents)) {
    visitNode(document.contents.get("node", true));
    // Older flows retain relative paths as import-map keys until migration.
    const imports = document.contents.get("imports", true);
    if (isMap(imports)) {
      for (const pair of imports.items) {
        if (isScalar(pair.key) && typeof pair.key.value === "string" &&
          (pair.key.value.startsWith(".") || isAbsolute(pair.key.value))) {
          update(pair.key);
        }
      }
    }
  }
  return edits;
}
