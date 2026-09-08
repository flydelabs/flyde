import * as vscode from "vscode";
import { getImportEdits } from "./importEdits";

export function registerImportRenames(
  output: vscode.OutputChannel,
): vscode.Disposable {
  return vscode.workspace.onWillRenameFiles((event) => {
    // waitUntil must be called synchronously during event dispatch. VS Code
    // applies the returned edits before moving files, including dirty documents.
    event.waitUntil(prepareImportRenames(event, output));
  });
}

async function prepareImportRenames(
  event: vscode.FileWillRenameEvent,
  output: vscode.OutputChannel,
): Promise<vscode.WorkspaceEdit> {
  const edit = new vscode.WorkspaceEdit();
  const moves = event.files
    .filter(
      (file) => file.oldUri.scheme === "file" && file.newUri.scheme === "file",
    )
    .map((file) => ({
      oldPath: file.oldUri.fsPath,
      newPath: file.newUri.fsPath,
    }));
  if (!moves.length) {
    return edit;
  }
  const uris = await vscode.workspace.findFiles(
    "**/*.flyde",
    "**/{node_modules,.git}/**",
    undefined,
    event.token,
  );
  const documents = new Map(uris.map((uri) => [uri.toString(), uri]));
  for (const document of vscode.workspace.textDocuments) {
    if (
      document.uri.scheme === "file" &&
      document.uri.path.endsWith(".flyde")
    ) {
      documents.set(document.uri.toString(), document.uri);
    }
  }
  for (const uri of documents.values()) {
    if (event.token.isCancellationRequested) {
      return new vscode.WorkspaceEdit();
    }
    try {
      const document = await vscode.workspace.openTextDocument(uri);
      for (const change of getImportEdits(
        document.getText(),
        uri.fsPath,
        moves,
      )) {
        edit.replace(
          uri,
          new vscode.Range(
            document.positionAt(change.start),
            document.positionAt(change.end),
          ),
          change.text,
        );
      }
    } catch (error) {
      output.appendLine(
        `Could not update Flyde imports in ${uri.fsPath}: ${error}`,
      );
    }
  }
  return edit;
}
