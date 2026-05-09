import * as vscode from "vscode";
import { deserializeFlow, serializeFlow } from "@flyde/loader/dist/server";
import {
  RenamePair,
  rewriteRenamedFileReferences,
} from "./flyde-file-rename-utils";

export { rewriteRenamedFileReferences } from "./flyde-file-rename-utils";

export function registerFlydeFileRenameHandler(
  outputChannel: vscode.OutputChannel
): vscode.Disposable {
  return vscode.workspace.onDidRenameFiles(async (event) => {
    const renamePairs = event.files.map((file) => ({
      oldPath: file.oldUri.fsPath,
      newPath: file.newUri.fsPath,
    }));

    const updatedFiles = await updateFlydeReferencesForRenames(renamePairs);

    if (updatedFiles > 0) {
      outputChannel.appendLine(
        `Updated Flyde import references in ${updatedFiles} file(s).`
      );
    }
  });
}

export async function updateFlydeReferencesForRenames(
  renamePairs: RenamePair[]
): Promise<number> {
  if (renamePairs.length === 0) {
    return 0;
  }

  const flowUris = await vscode.workspace.findFiles(
    "**/*.flyde",
    "**/node_modules/**"
  );

  let updatedFiles = 0;

  for (const flowUri of flowUris) {
    try {
      const fileBytes = await vscode.workspace.fs.readFile(flowUri);
      const flowText = Buffer.from(fileBytes).toString("utf8");
      const flow = deserializeFlow(flowText, flowUri.fsPath);

      if (rewriteRenamedFileReferences(flow, flowUri.fsPath, renamePairs)) {
        await vscode.workspace.fs.writeFile(
          flowUri,
          Buffer.from(serializeFlow(flow), "utf8")
        );
        updatedFiles += 1;
      }
    } catch (error) {
      console.warn(
        `Failed to update Flyde imports in ${flowUri.fsPath}`,
        error
      );
    }
  }

  return updatedFiles;
}
