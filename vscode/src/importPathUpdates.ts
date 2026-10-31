import * as vscode from "vscode";
import {
  FileMove,
  mapPathThroughMovesBackwards,
  rewriteImportPathsAfterMove,
} from "@flyde/loader";
import {
  clearImportPathRepairs,
  markImportPathRepairs,
} from "./flydeEditor";

const RENAME_COALESCE_MS = 150;

interface ChangedDocument {
  document: vscode.TextDocument;
  updated: string;
  wasDirty: boolean;
}

type RepairResult = "applied" | "aborted" | "failed";

async function repairImportPaths(
  moves: FileMove[],
  hasPendingMoves: () => boolean
): Promise<RepairResult> {
  const flowUris = await vscode.workspace.findFiles(
    "**/*.flyde",
    "**/node_modules/**"
  );

  const documents = await Promise.all(
    flowUris.map((uri) => vscode.workspace.openTextDocument(uri))
  );

  const edit = new vscode.WorkspaceEdit();
  const changedDocuments: ChangedDocument[] = [];

  // Compute all replacements without awaiting, so no edit can slip in between
  // reading a document and applying its replacement.
  for (const document of documents) {
    const contents = document.getText();
    const updated = rewriteImportPathsAfterMove(contents, {
      flowBefore: mapPathThroughMovesBackwards(document.uri.fsPath, moves),
      flowAfter: document.uri.fsPath,
      moves,
    });

    if (updated === contents) {
      continue;
    }

    changedDocuments.push({
      document,
      updated,
      wasDirty: document.isDirty,
    });
    edit.replace(
      document.uri,
      new vscode.Range(
        document.positionAt(0),
        document.positionAt(contents.length)
      ),
      updated
    );
  }

  if (changedDocuments.length === 0) {
    return "applied";
  }

  if (hasPendingMoves()) {
    return "aborted";
  }

  const changedPaths = changedDocuments.map(
    ({ document }) => document.uri.fsPath
  );
  markImportPathRepairs(
    changedDocuments.map(({ document, updated }) => ({
      filePath: document.uri.fsPath,
      contents: updated,
    }))
  );

  let applied = false;
  try {
    applied = await vscode.workspace.applyEdit(edit);
  } catch (error) {
    clearImportPathRepairs(changedPaths);
    throw error;
  }

  if (!applied) {
    console.error("Failed to apply import path updates after rename");
    clearImportPathRepairs(changedPaths);
    return "failed";
  }

  // Markers are consumed by the editor's change listener. Clearing them here
  // would race the asynchronous change events and could let a repair replace
  // unsaved webview state.
  await Promise.all(
    changedDocuments
      .filter(({ wasDirty }) => !wasDirty)
      .map(({ document }) => document.save())
  );

  return "applied";
}

export function registerImportPathUpdatesForFileMoves(
  context: vscode.ExtensionContext
): void {
  let pendingMoves: FileMove[] = [];
  let flushTimer: ReturnType<typeof setTimeout> | undefined;
  let repairing = false;

  const flush = async () => {
    flushTimer = undefined;

    if (repairing) {
      flushTimer = setTimeout(flush, 50);
      return;
    }

    const moves = pendingMoves;
    pendingMoves = [];

    if (moves.length === 0) {
      return;
    }

    repairing = true;
    try {
      const result = await repairImportPaths(
        moves,
        () => pendingMoves.length > 0
      );

      if (result === "aborted") {
        pendingMoves.unshift(...moves);
      }
    } catch (error) {
      console.error("Failed to update import paths after rename", error);
    } finally {
      repairing = false;

      if (pendingMoves.length > 0 && flushTimer === undefined) {
        flushTimer = setTimeout(flush, 50);
      }
    }
  };

  context.subscriptions.push(
    vscode.workspace.onDidRenameFiles((event) => {
      const moves: FileMove[] = event.files.map((file) => ({
        from: file.oldUri.fsPath,
        to: file.newUri.fsPath,
      }));

      if (moves.length === 0) {
        return;
      }

      // Coalesce rapid renames so their moves are applied as one chain.
      pendingMoves.push(...moves);
      if (flushTimer !== undefined) {
        clearTimeout(flushTimer);
      }
      flushTimer = setTimeout(flush, RENAME_COALESCE_MS);
    }),
    {
      dispose: () => {
        if (flushTimer !== undefined) {
          clearTimeout(flushTimer);
        }
      },
    }
  );
}
