import * as path from "path";
import * as vscode from "vscode";
import { isMap, isScalar, parseDocument } from "yaml";

interface Move {
  oldPath: string;
  newPath: string;
}

// Apply the most specific move once. Rename entries describe one operation,
// not a sequence of operations (important for swaps and nested moves).
function movedPath(file: string, moves: readonly Move[]): string {
  for (const move of moves) {
    const suffix = path.relative(move.oldPath, file);
    if (
      suffix === "" ||
      (!path.isAbsolute(suffix) &&
        suffix !== ".." &&
        !suffix.startsWith(`..${path.sep}`))
    ) {
      return path.join(move.newPath, suffix);
    }
  }
  return file;
}

async function createImportEdits(
  event: vscode.FileWillRenameEvent
): Promise<vscode.WorkspaceEdit> {
  const moves = event.files
    .filter(({ oldUri, newUri }) =>
      oldUri.scheme === "file" && newUri.scheme === "file"
    )
    .map(({ oldUri, newUri }) => ({
      oldPath: oldUri.fsPath,
      newPath: newUri.fsPath,
    }))
    .sort((a, b) => b.oldPath.length - a.oldPath.length);
  const edit = new vscode.WorkspaceEdit();
  if (moves.length === 0) {
    return edit;
  }

  const uris = new Map<string, vscode.Uri>();
  const add = (uri: vscode.Uri) => {
    if (uri.scheme === "file" && uri.path.endsWith(".flyde")) {
      uris.set(uri.toString(), uri);
    }
  };
  const files = await vscode.workspace.findFiles(
    "**/*.flyde",
    "**/{node_modules,.git}/**"
  );
  files.forEach(add);
  vscode.workspace.textDocuments.forEach((document) => add(document.uri));
  event.files.forEach(({ oldUri }) => add(oldUri));

  for (const uri of uris.values()) {
    const document = await vscode.workspace.openTextDocument(uri);
    const parsed = parseDocument(document.getText());
    if (parsed.errors.length > 0) {
      throw new Error(`Cannot update imports in invalid YAML: ${uri.fsPath}`);
    }
    const imports = parsed.get("imports", true);
    if (!isMap(imports)) {
      continue;
    }

    const oldImporter = uri.fsPath;
    const newImporter = movedPath(oldImporter, moves);
    const keys = new Set<string>();
    for (const item of imports.items) {
      const key = item.key;
      if (!isScalar(key) || typeof key.value !== "string") {
        continue;
      }
      const original = key.value;
      let replacement = original;
      // Bare package specifiers must never be interpreted as local paths.
      if (original.startsWith("./") || original.startsWith("../")) {
        const oldTarget = path.resolve(path.dirname(oldImporter), original);
        const newTarget = movedPath(oldTarget, moves);
        if (oldImporter !== newImporter || oldTarget !== newTarget) {
          replacement = path
            .relative(path.dirname(newImporter), newTarget)
            .split(path.sep)
            .join("/");
          if (!replacement.startsWith("../")) {
            replacement = `./${replacement}`;
          }
        }
      }
      if (keys.has(replacement)) {
        throw new Error(`Import path collision in ${uri.fsPath}: ${replacement}`);
      }
      keys.add(replacement);
      if (replacement !== original && key.range) {
        edit.replace(
          uri,
          new vscode.Range(
            document.positionAt(key.range[0]),
            document.positionAt(key.range[1])
          ),
          JSON.stringify(replacement)
        );
      }
    }
  }
  return edit;
}

export function registerFlowImportRenames(): vscode.Disposable {
  return vscode.workspace.onWillRenameFiles((event) => {
    event.waitUntil(createImportEdits(event));
