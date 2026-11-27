import * as vscode from "vscode";
import * as path from "path";
import {
  FileRename,
  mapOriginalPath,
  updateFlowImports,
} from "./updateFlowImports";

export async function updateImportsAfterRename(
  files: ReadonlyArray<{ oldUri: vscode.Uri; newUri: vscode.Uri }>
) {
  const renames: FileRename[] = files.map(({ oldUri, newUri }) => ({
    oldPath: oldUri.fsPath,
    newPath: newUri.fsPath,
  }));

  const flows = await vscode.workspace.findFiles(
    "**/*.flyde",
    "**/node_modules/**"
  );

  for (const flowUri of flows) {
    const currentPath = flowUri.fsPath;
    const pathBefore = mapOriginalPath(currentPath, renames) ?? currentPath;

    const original = Buffer.from(
      await vscode.workspace.fs.readFile(flowUri)
    ).toString("utf8");
    const updated = updateFlowImports(
      original,
      path.dirname(pathBefore),
      path.dirname(currentPath),
      renames
    );

    if (updated !== original) {
      await vscode.workspace.fs.writeFile(flowUri, Buffer.from(updated, "utf8"));
    }
  }
}
