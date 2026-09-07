import * as vscode from "vscode";
import { deserializeFlow, serializeFlow } from "@flyde/loader/dist/server";
import { updateFileReferences } from "./updateFileReferences";

export function registerFileRenameHandler(
  output: Pick<vscode.OutputChannel, "appendLine">
): vscode.Disposable {
  return vscode.workspace.onWillRenameFiles((event) => {
    event.waitUntil((async () => {
      const moves = event.files.map(({ oldUri, newUri }) => ({
        oldPath: oldUri.fsPath,
        newPath: newUri.fsPath,
      }));
      const uris = await vscode.workspace.findFiles("**/*.flyde", "**/node_modules/**");
      const documents = new Map(uris.map(uri => [uri.toString(), uri]));
      for (const document of vscode.workspace.textDocuments) {
        if (!document.isUntitled && document.uri.path.endsWith(".flyde")) {
          documents.set(document.uri.toString(), document.uri);
        }
      }

      const edit = new vscode.WorkspaceEdit();
      for (const uri of documents.values()) {
        try {
          const document = await vscode.workspace.openTextDocument(uri);
          const text = document.getText();
          const flow = deserializeFlow(text, uri.fsPath);
          if (updateFileReferences(flow, uri.fsPath, moves)) {
            edit.replace(uri, new vscode.Range(
              document.positionAt(0), document.positionAt(text.length)
            ), serializeFlow(flow));
          }
        } catch (error) {
          output.appendLine(`Could not update Flyde imports in ${uri.fsPath}: ${error}`);
        }
      }
      return edit;
    })());
  });
}
