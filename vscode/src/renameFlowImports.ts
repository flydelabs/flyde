import * as vscode from "vscode";
import { getFlowImportEdits } from "./flowImportEdits";

export function registerFlowImportRenames(output: vscode.OutputChannel): vscode.Disposable {
  return vscode.workspace.onWillRenameFiles((event) => {
    event.waitUntil((async () => {
      const edit = new vscode.WorkspaceEdit();
      const files = await vscode.workspace.findFiles("**/*.flyde", "**/node_modules/**");
      for (const uri of files) {
        const moves = event.files
          .filter(({ oldUri, newUri }) => oldUri.scheme === uri.scheme &&
            newUri.scheme === uri.scheme && oldUri.authority === uri.authority &&
            newUri.authority === uri.authority)
          .map(({ oldUri, newUri }) => ({ oldPath: oldUri.path, newPath: newUri.path }));
        if (!moves.length) {
          continue;
        }
        try {
          const document = await vscode.workspace.openTextDocument(uri);
          for (const change of getFlowImportEdits(document.getText(), uri.path, moves)) {
            edit.replace(uri, new vscode.Range(
              document.positionAt(change.start), document.positionAt(change.end)
            ), change.text);
          }
        } catch (error) {
          output.appendLine(`Could not update imports in ${uri.fsPath}: ${error}`);
        }
      }
      return edit;
    })());
  });
}
