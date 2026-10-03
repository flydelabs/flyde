import * as vscode from "vscode";
import { updateFlowPathsForRenames } from "@flyde/loader";

/** Build edits against the old URIs; VS Code applies them before the move. */
export async function createFlowImportRenameEdit(
  files: readonly { oldUri: vscode.Uri; newUri: vscode.Uri }[],
  output: Pick<vscode.OutputChannel, "appendLine">
): Promise<vscode.WorkspaceEdit> {
  const edit = new vscode.WorkspaceEdit();
  const renames = files
    .filter(({ oldUri, newUri }) => oldUri.scheme === "file" && newUri.scheme === "file")
    .map(({ oldUri, newUri }) => ({ oldPath: oldUri.fsPath, newPath: newUri.fsPath }));

  if (renames.length === 0) {
    return edit;
  }

  // findFiles searches every workspace root. Include unsaved/open flows as well.
  const uris = new Map<string, vscode.Uri>();
  for (const uri of await vscode.workspace.findFiles("**/*.flyde", "**/{node_modules,.git}/**")) {
    uris.set(uri.toString(), uri);
  }
  for (const document of vscode.workspace.textDocuments) {
    if (document.uri.scheme === "file" && document.uri.path.endsWith(".flyde")) {
      uris.set(document.uri.toString(), document.uri);
    }
  }

  const documents = await Promise.all(
    [...uris.values()].map(async (uri) => {
      try {
        return await vscode.workspace.openTextDocument(uri);
      } catch (error) {
        output.appendLine(`Could not check Flyde imports in ${uri.fsPath}: ${error}`);
        return undefined;
      }
    })
  );

  // Read current buffers only after all asynchronous discovery has finished.
  // Do not save documents: the user's existing unsaved changes must survive.
  for (const document of documents) {
    if (!document || document.isClosed) {
      continue;
    }
    try {
      const text = updateFlowPathsForRenames(document.getText(), document.uri.fsPath, renames);
      if (text !== undefined) {
        const range = new vscode.Range(document.positionAt(0), document.positionAt(document.getText().length));
        edit.replace(document.uri, range, text);
      }
    } catch (error) {
      // One malformed flow must not prevent valid consumers from being repaired.
      output.appendLine(`Could not update Flyde imports in ${document.uri.fsPath}: ${error}`);
    }
  }

  return edit;
}

export function registerFlowImportRenameHandler(
  output: Pick<vscode.OutputChannel, "appendLine">
): vscode.Disposable {
  return vscode.workspace.onWillRenameFiles((event) => {
    // waitUntil must be called synchronously while the event is being dispatched.
    event.waitUntil(createFlowImportRenameEdit(event.files, output));
  });
}
