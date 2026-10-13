import * as vscode from "vscode";
import { getFileImportRenameEdits } from "@flyde/loader/dist/server";

export function registerFileImportRenames(): vscode.Disposable {
  return vscode.workspace.onWillRenameFiles((event) => {
    event.waitUntil(createFileImportRenameEdit(event));
  });
}

export async function createFileImportRenameEdit(
  event: vscode.FileWillRenameEvent
): Promise<vscode.WorkspaceEdit> {
  const edit = new vscode.WorkspaceEdit();
  const renames = event.files
    .filter(({ oldUri, newUri }) => oldUri.scheme === "file" && newUri.scheme === "file")
    .map(({ oldUri, newUri }) => ({ oldPath: oldUri.fsPath, newPath: newUri.fsPath }));
  if (!renames.length || event.token.isCancellationRequested) {
    return edit;
  }

  const uris = await vscode.workspace.findFiles("**/*.flyde", "**/node_modules/**", undefined, event.token);
  const candidates = new Map(uris.map(uri => [uri.toString(), uri]));
  for (const document of vscode.workspace.textDocuments) {
    if (document.uri.path.endsWith(".flyde")) {
      candidates.set(document.uri.toString(), document.uri);
    }
  }
  for (const { oldUri } of event.files) {
    if (oldUri.path.endsWith(".flyde")) {
      candidates.set(oldUri.toString(), oldUri);
    }
  }

  const versions = new Map<vscode.TextDocument, number>();
  for (const uri of candidates.values()) {
    if (event.token.isCancellationRequested) {
      return new vscode.WorkspaceEdit();
    }
    if (uri.scheme !== "file") {
      continue;
    }
    const document = await vscode.workspace.openTextDocument(uri);
    const changes = getFileImportRenameEdits(document.getText(), uri.fsPath, renames);
    if (changes.length) {
      versions.set(document, document.version);
      edit.set(uri, changes.map(change => vscode.TextEdit.replace(
        new vscode.Range(document.positionAt(change.start), document.positionAt(change.end)),
        change.text
      )));
    }
  }
  if (event.token.isCancellationRequested ||
    [...versions].some(([document, version]) => document.version !== version)) {
    return new vscode.WorkspaceEdit();
  }
  return edit;
}
