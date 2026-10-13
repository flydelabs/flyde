import { dirname, isAbsolute, relative, resolve, sep } from "path";
import { isMap, isScalar, isSeq, parseDocument } from "yaml";

export interface FileRename {
  oldPath: string;
  newPath: string;
}

export interface ImportPathEdit {
  start: number;
  end: number;
  text: string;
}

export function getFileImportRenameEdits(
  contents: string,
  flowPath: string,
  renames: readonly FileRename[]
): ImportPathEdit[] {
  const document = parseDocument(contents);
  if (document.errors.length || !isMap(document.contents)) {
    return [];
  }

  const moves = renames.map(({ oldPath, newPath }) => ({
    oldPath: resolve(oldPath),
    newPath: resolve(newPath),
  })).sort((a, b) => b.oldPath.length - a.oldPath.length);
  const movedPath = (path: string) => {
    const move = moves.find(({ oldPath }) =>
      path === oldPath || path.startsWith(oldPath + sep)
    );
    return move ? move.newPath + path.slice(move.oldPath.length) : path;
  };

  const oldDirectory = dirname(resolve(flowPath));
  const newDirectory = dirname(movedPath(resolve(flowPath)));
  const edits: ImportPathEdit[] = [];
  const update = (value: unknown) => {
    if (!isScalar(value) || typeof value.value !== "string" || !value.range || value.anchor) {
      return;
    }
    const oldTarget = resolve(oldDirectory, value.value);
    const newTarget = movedPath(oldTarget);
    if (oldTarget === newTarget && oldDirectory === newDirectory) {
      return;
    }
    const newValue = isAbsolute(value.value)
      ? newTarget
      : relative(newDirectory, newTarget).split(sep).join("/");
    const importPath = isAbsolute(newValue) || newValue.startsWith(".")
      ? newValue
      : `./${newValue}`;
    if (importPath !== value.value) {
      edits.push({ start: value.range[0], end: value.range[1], text: JSON.stringify(importPath) });
    }
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
      if (isMap(source)) {
        if (source.get("type") === "file") {
          update(source.get("data", true));
        } else if (source.get("type") === "inline") {
          visitNode(source.get("data", true));
        }
      }
      visitNode(instance.get("node", true));
    }
  };
  visitNode(document.contents.get("node", true));

  const imports = document.contents.get("imports", true);
  if (isMap(imports)) {
    for (const { key } of imports.items) {
      if (isScalar(key) && typeof key.value === "string" &&
        (key.value.startsWith(".") || isAbsolute(key.value) || /\.flyde(?:\.[jt]s)?$/.test(key.value))) {
        update(key);
      }
    }
  }
  return edits;
}
