import * as vscode from "vscode";
import * as path from "path";

export function activateUpdateImportsOnFileMove(context: vscode.ExtensionContext) {
  const disposable = vscode.workspace.onDidRenameFiles(async (event) => {
    for (const { oldUri, newUri } of event.files) {
      if (!oldUri.fsPath.endsWith(".flyde")) continue;

      const flydeFiles = await vscode.workspace.findFiles(
        "**/*.flyde",
        "**/node_modules/**"
      );

      const oldPath = vscode.workspace.asRelativePath(oldUri, false);
      const newPath = vscode.workspace.asRelativePath(newUri, false);
      const oldBaseName = path.basename(oldUri.fsPath, ".flyde");
      const newBaseName = path.basename(newUri.fsPath, ".flyde");

      for (const file of flydeFiles) {
        if (file.fsPath === newUri.fsPath) continue;

        try {
          const doc = await vscode.workspace.openTextDocument(file);
          const text = doc.getText();

          if (text.includes(oldPath) || text.includes(oldBaseName)) {
            let updatedText = text;
            updatedText = updatedText.split(oldPath).join(newPath);
            if (oldBaseName !== newBaseName) {
              updatedText = updatedText.split(oldBaseName).join(newBaseName);
            }

            if (updatedText !== text) {
              const edit = new vscode.WorkspaceEdit();
              edit.replace(
                file,
                new vscode.Range(
                  new vscode.Position(0, 0),
                  new vscode.Position(doc.lineCount, 0)
                ),
                updatedText
              );
              await vscode.workspace.applyEdit(edit);
              await doc.save();
              vscode.window.showInformationMessage(
                `Updated imports in ${path.basename(file.fsPath)} after file move.`
              );
            }
          }
        } catch (err) {
          console.error(`Failed to update imports in ${file.fsPath}:`, err);
        }
      }
    }
  });

  context.subscriptions.push(disposable);
}
