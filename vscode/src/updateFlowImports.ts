import * as path from "path";

export interface FileRename {
  oldPath: string;
  newPath: string;
}

export function mapRenamedPath(
  target: string,
  renames: FileRename[]
): string | undefined {
  for (const { oldPath, newPath } of renames) {
    if (target === oldPath) {
      return newPath;
    }
    if (target.startsWith(oldPath + path.sep)) {
      return newPath + target.slice(oldPath.length);
    }
  }
  return undefined;
}

export function mapOriginalPath(
  current: string,
  renames: FileRename[]
): string | undefined {
  return mapRenamedPath(
    current,
    renames.map(({ oldPath, newPath }) => ({
      oldPath: newPath,
      newPath: oldPath,
    }))
  );
}

function toImportKey(fromDir: string, target: string): string {
  const relative = path.relative(fromDir, target).split(path.sep).join("/");
  return relative.startsWith(".") ? relative : `./${relative}`;
}

const KEY_LINE = /^(\s+)(["']?)([^"'\n]+?)\2(\s*:.*)$/;

export function updateFlowImports(
  contents: string,
  flowDirBefore: string,
  flowDirAfter: string,
  renames: FileRename[]
): string {
  const eol = contents.includes("\r\n") ? "\r\n" : "\n";
  const lines = contents.split(/\r?\n/);

  let inImports = false;
  let keyIndent: string | undefined;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (/^imports\s*:/.test(line)) {
      inImports = true;
      keyIndent = undefined;
      continue;
    }
    if (!inImports) {
      continue;
    }
    if (line.trim() === "" || line.trim().startsWith("#")) {
      continue;
    }
    if (!/^\s/.test(line)) {
      inImports = false;
      continue;
    }

    const match = KEY_LINE.exec(line);
    if (!match) {
      continue;
    }
    const [, indent, quote, key, rest] = match;
    if (keyIndent === undefined) {
      keyIndent = indent;
    }
    // list items ("- Name") are deeper than the keys or start with "-"
    if (indent !== keyIndent || key.startsWith("-")) {
      continue;
    }
    // package names (e.g. @flyde/stdlib) are not paths
    if (!key.startsWith(".")) {
      continue;
    }

    const oldTarget = path.resolve(flowDirBefore, key);
    const newTarget = mapRenamedPath(oldTarget, renames) ?? oldTarget;
    const newKey = toImportKey(flowDirAfter, newTarget);

    if (newKey !== key) {
      lines[i] = `${indent}${quote}${newKey}${quote}${rest}`;
    }
  }

  return lines.join(eol);
}
