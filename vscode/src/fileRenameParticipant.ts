import * as vscode from "vscode";
import { fileReferenceEditsForRenames } from "@flyde/loader/dist/server";

export function registerFileRenameParticipant(output: Pick<vscode.OutputChannel, "appendLine">): vscode.Disposable {
  return vscode.workspace.onWillRenameFiles(event => {
    event.waitUntil((async () => {
      const uris = new Map((await vscode.workspace.findFiles("**/*.flyde", "**/node_modules/**"))
        .map(uri => [uri.toString(), uri]));
      for (const document of vscode.workspace.textDocuments) {
        if (!document.isUntitled && document.uri.path.endsWith(".flyde")) {
          uris.set(document.uri.toString(), document.uri);
        }
      }
      const edit = new vscode.WorkspaceEdit();
      const snapshots = new Map<vscode.TextDocument, number>();
      for (const uri of uris.values()) {
        if (event.token.isCancellationRequested) {
          return;
        }
        const renames = event.files.filter(({ oldUri, newUri }) =>
          oldUri.scheme === uri.scheme && newUri.scheme === uri.scheme &&
          oldUri.authority === uri.authority && newUri.authority === uri.authority
        ).map(({ oldUri, newUri }) => ({ oldPath: oldUri.fsPath, newPath: newUri.fsPath }));
        if (!renames.length) {
          continue;
        }
        try {
          const document = await vscode.workspace.openTextDocument(uri);
          snapshots.set(document, document.version);
          for (const replacement of fileReferenceEditsForRenames(document.getText(), uri.fsPath, renames)) {
            edit.replace(uri, new vscode.Range(document.positionAt(replacement.start), document.positionAt(replacement.end)), replacement.text);
          }
        } catch (error) {
          output.appendLine(`Unable to update imports in ${uri.fsPath}: ${error}`);
        }
      }
      if (event.token.isCancellationRequested || [...snapshots].some(([document, version]) => document.version !== version)) {
        output.appendLine("Skipped Flyde import updates because documents changed during the rename scan.");
        return;
      }
      return edit;
    })());
  });
}
