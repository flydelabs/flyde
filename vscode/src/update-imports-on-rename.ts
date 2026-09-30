import * as vscode from "vscode";
import {
  updateFlydeImportsAfterMove,
  MovedFile,
} from "@flyde/loader/dist/server";

/**
 * Keeps .flyde imports working when files are moved or renamed in the
 * workspace (fixes https://github.com/flydelabs/flyde/issues/112).
 *
 * Flow files reference imported nodes through workspace-relative paths, so
 * moving an imported .flyde (or .flyde.ts) file used to break the import.
 * This listener rewrites the affected `source.data` references in every flow
 * file after a rename - both when an imported file moved and when a flow
 * file itself moved (in which case its relative imports are re-relativized).
 */
export function registerFlydeImportMoveUpdater(
  context: vscode.ExtensionContext
) {
  context.subscriptions.push(
    vscode.workspace.onDidRenameFiles((event) => {
      handleRenamedFiles(event.files).catch((e) => {
        console.error("Flyde: failed to update imports after file move", e);
      });
    })
  );
}

async function handleRenamedFiles(
  files: readonly { oldUri: vscode.Uri; newUri: vscode.Uri }[]
) {
  const moves: MovedFile[] = files
    .map(({ oldUri, newUri }) => ({
      oldPath: oldUri.fsPath,
      newPath: newUri.fsPath,
    }))
    .filter(({ oldPath, newPath }) => oldPath !== newPath);

  if (moves.length === 0) {
    return;
  }

  const previousPathByNewPath = new Map(
    moves.map(({ oldPath, newPath }) => [newPath, oldPath])
  );

  const flowUris = await vscode.workspace.findFiles(
    "**/*.flyde",
    "**/node_modules/**"
  );

  await Promise.all(
    flowUris.map(async (uri) => {
      try {
        const flowPathAfter = uri.fsPath;
        const flowPathBefore =
          previousPathByNewPath.get(flowPathAfter) ?? flowPathAfter;

        const raw = await vscode.workspace.fs.readFile(uri);
        const original = Buffer.from(raw).toString("utf8");

        let contents = original;
        let baseBefore = flowPathBefore;
        for (const move of moves) {
          const updated = updateFlydeImportsAfterMove(
            contents,
            baseBefore,
            flowPathAfter,
            move
          );
          if (updated !== null) {
            contents = updated;
          }
          baseBefore = flowPathAfter;
        }

        if (contents !== original) {
          await vscode.workspace.fs.writeFile(uri, Buffer.from(contents, "utf8"));
        }
      } catch (e) {
        console.error(`Flyde: failed to update imports in ${uri.fsPath}`, e);
      }
    })
  );
}
