import * as vscode from "vscode";
import { getReferenceEditsForRename } from "@flyde/loader/dist/server";

export function registerRenameReferences(
  output: vscode.OutputChannel
): vscode.Disposable {
  return vscode.workspace.onWillRenameFiles((event) => {
    // Text edits apply at the old URIs before VS Code renames the files.
    event.waitUntil(prepareRenameReferences(event.files, output));
  });
}

export async function prepareRenameReferences(
  files: vscode.FileWillRenameEvent["files"],
  output: vscode.OutputChannel
): Promise<vscode.WorkspaceEdit> {
  const edit = new vscode.WorkspaceEdit();
  const flows = await vscode.workspace.findFiles(
    "**/*.flyde",
    "**/{node_modules,.git}/**"
  );
  const versions = new Map<vscode.TextDocument, number>();

  for (const uri of flows) {
    const renames = files
      .filter(
        ({ oldUri, newUri }) =>
          oldUri.scheme === uri.scheme &&
          newUri.scheme === uri.scheme &&
          oldUri.authority === uri.authority &&
          newUri.authority === uri.authority
      )
      .map(({ oldUri, newUri }) => ({
        oldPath: oldUri.fsPath,
        newPath: newUri.fsPath,
      }));
    if (renames.length === 0) {
      continue;
    }

    try {
      const document = await vscode.workspace.openTextDocument(uri);
      const changes = getReferenceEditsForRename(
        document.getText(),
        uri.fsPath,
        renames
      );
      if (changes.length === 0) {
        continue;
      }
      versions.set(document, document.version);
      for (const change of changes) {
        edit.replace(
          uri,
          new vscode.Range(
            document.positionAt(change.start),
            document.positionAt(change.end)
          ),
          change.text
        );
      }
    } catch {
      output.appendLine(`Could not update moved references in ${uri.fsPath}`);
    }
  }

  for (const [document, version] of versions) {
    if (document.version !== version) {
      throw new Error("A flow changed while preparing rename edits");
    }
  }
  return edit;
}
