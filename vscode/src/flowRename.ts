import * as vscode from "vscode";
import { remapFlowPaths } from "./remapFlowPaths";

export function registerFlowRenameHandler(context: Pick<vscode.ExtensionContext, "subscriptions">): void {
  context.subscriptions.push(vscode.workspace.onWillRenameFiles((event) => {
    event.waitUntil((async () => {
      const moves = event.files
        .filter(({ oldUri, newUri }) => oldUri.scheme === "file" && newUri.scheme === "file")
        .map(({ oldUri, newUri }) => ({ oldPath: oldUri.fsPath, newPath: newUri.fsPath }));
      if (!moves.length) { return; }
      const diskFlows = await vscode.workspace.findFiles("**/*.flyde", "**/node_modules/**");
      const flows = new Map(diskFlows.map((uri) => [uri.toString(), uri]));
      // Include dirty and open flows that have not yet been written to disk.
      for (const document of vscode.workspace.textDocuments) {
        if (document.uri.scheme === "file" && document.uri.path.endsWith(".flyde")) {
          flows.set(document.uri.toString(), document.uri);
        }
      }
      const edit = new vscode.WorkspaceEdit();
      const failed: string[] = [];
      for (const uri of flows.values()) {
        try {
          const document = await vscode.workspace.openTextDocument(uri);
          const text = document.getText();
          const replacement = remapFlowPaths(text, uri.fsPath, moves);
          if (replacement !== undefined) {
            edit.replace(uri, new vscode.Range(document.positionAt(0), document.positionAt(text.length)), replacement);
          }
        } catch {
          // One invalid/unreadable flow must not prevent updating valid flows.
          failed.push(vscode.workspace.asRelativePath(uri));
        }
      }
      if (failed.length) {
        void vscode.window.showWarningMessage(`Flyde could not update file references in: ${failed.join(", ")}`);
      }
      return edit;
    })());
  }));
}
