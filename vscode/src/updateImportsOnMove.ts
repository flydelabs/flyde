import * as vscode from "vscode";
import {
  RenamedFileEntry,
  updateFlowImportsOnRename,
} from "./flowImportLogic";

export function registerFileMoveImportUpdater(
  context: vscode.ExtensionContext
) {
  const disposable = vscode.workspace.onDidRenameFiles(async (event) => {
    const renamedFiles: RenamedFileEntry[] = event.files.map((f) => ({
      oldPath: f.oldUri.fsPath,
      newPath: f.newUri.fsPath,
    }));

    if (renamedFiles.length === 0) {
      return;
    }

    const flydeUris = await vscode.workspace.findFiles(
      "**/*.flyde",
      "**/node_modules/**"
    );

    const workspaceEdit = new vscode.WorkspaceEdit();
    const docsToSave: vscode.TextDocument[] = [];
    let hasEdits = false;

    for (const uri of flydeUris) {
      try {
        const openDoc = vscode.workspace.textDocuments.find(
          (doc) => doc.uri.toString() === uri.toString()
        );
        const wasDirty = openDoc ? openDoc.isDirty : false;
        const document =
          openDoc ?? (await vscode.workspace.openTextDocument(uri));
        const currentText = document.getText();

        const updatedText = updateFlowImportsOnRename(
          currentText,
          uri.fsPath,
          renamedFiles
        );

        if (updatedText !== null && updatedText !== currentText) {
          const fullRange = new vscode.Range(
            document.positionAt(0),
            document.positionAt(currentText.length)
          );
          workspaceEdit.replace(uri, fullRange, updatedText);
          hasEdits = true;
          if (!wasDirty) {
            docsToSave.push(document);
          }
        }
      } catch (err) {
        console.error(`Error updating Flyde imports in ${uri.fsPath}:`, err);
      }
    }

    if (hasEdits) {
      const applied = await vscode.workspace.applyEdit(workspaceEdit);
      if (applied) {
        for (const doc of docsToSave) {
          await doc.save();
        }
      }
    }
  });

  context.subscriptions.push(disposable);
}
