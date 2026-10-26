import * as vscode from "vscode";
import { join, relative, resolve, sep } from "path";
import {
  FileMove,
  updateFlowImportsForMovedFiles,
} from "@flyde/loader/dist/server";

function getNewFlowPath(flowPath: string, moves: FileMove[]): string {
  const normalizedFlow = resolve(flowPath);

  for (const move of moves) {
    const oldAbs = resolve(move.oldPath);
    const newAbs = resolve(move.newPath);

    if (normalizedFlow === oldAbs) {
      return newAbs;
    }

    if (normalizedFlow.startsWith(oldAbs + sep)) {
      return join(newAbs, relative(oldAbs, normalizedFlow));
    }
  }

  return normalizedFlow;
}

export async function createMovedFilesWorkspaceEdit(
  renamedFiles: readonly {
    readonly oldUri: vscode.Uri;
    readonly newUri: vscode.Uri;
  }[]
): Promise<vscode.WorkspaceEdit> {
  const edit = new vscode.WorkspaceEdit();
  const moves: FileMove[] = renamedFiles.map(({ oldUri, newUri }) => ({
    oldPath: oldUri.fsPath,
    newPath: newUri.fsPath,
  }));

  if (moves.length === 0) {
    return edit;
  }

  const flydeUris = await vscode.workspace.findFiles(
    "**/*.flyde",
    "**/node_modules/**"
  );

  for (const uri of flydeUris) {
    try {
      const document = await vscode.workspace.openTextDocument(uri);
      const oldFlowPath = uri.fsPath;
      const newFlowPath = getNewFlowPath(oldFlowPath, moves);

      const { content, changed } = updateFlowImportsForMovedFiles(
        document.getText(),
        oldFlowPath,
        newFlowPath,
        moves
      );

      if (changed) {
        const fullRange = new vscode.Range(0, 0, document.lineCount, 0);
        edit.replace(uri, fullRange, content);
      }
    } catch (err) {
      console.error(`Failed to update imports for ${uri.fsPath}:`, err);
    }
  }

  return edit;
}

export function registerFileMoveHandler(): vscode.Disposable {
  return vscode.workspace.onWillRenameFiles((event) => {
    event.waitUntil(createMovedFilesWorkspaceEdit(event.files));
  });
}
