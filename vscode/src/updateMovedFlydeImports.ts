import * as path from "path";
import * as vscode from "vscode";
import { updateFlydeImportsForRenamedFiles } from "./flydeImportPathUpdater";

const textDecoder = new TextDecoder();
const textEncoder = new TextEncoder();

export function registerMovedFlydeImportUpdater(
  context: vscode.ExtensionContext,
  outputChannel: vscode.OutputChannel
) {
  context.subscriptions.push(
    vscode.workspace.onDidRenameFiles(async (event) => {
      const renames = event.files.map((file) => ({
        oldPath: file.oldUri.fsPath,
        newPath: file.newUri.fsPath,
      }));

      if (!renames.some((rename) => isFlydePath(rename.oldPath) || isFlydePath(rename.newPath))) {
        return;
      }

      const flydeFiles = await vscode.workspace.findFiles(
        "**/*.flyde",
        "**/node_modules/**"
      );

      let updatedCount = 0;

      for (const uri of flydeFiles) {
        try {
          const bytes = await vscode.workspace.fs.readFile(uri);
          const contents = textDecoder.decode(bytes);
          const result = updateFlydeImportsForRenamedFiles(
            contents,
            uri.fsPath,
            renames
          );

          if (result.changed) {
            await vscode.workspace.fs.writeFile(
              uri,
              textEncoder.encode(result.contents)
            );
            updatedCount += 1;
          }
        } catch (error) {
          outputChannel.appendLine(
            `Failed to update Flyde imports in ${uri.fsPath}: ${error}`
          );
        }
      }

      if (updatedCount > 0) {
        outputChannel.appendLine(
          `Updated Flyde imports in ${updatedCount} file(s) after rename.`
        );
      }
    })
  );
}

function isFlydePath(filePath: string) {
  return path.extname(filePath) === ".flyde";
}
