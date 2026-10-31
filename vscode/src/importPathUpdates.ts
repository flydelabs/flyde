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
const REPAIR_MARKER_TTL_MS = 1000;

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

  const documentResults = await Promise.allSettled(
    flowUris.map((uri) => vscode.workspace.openTextDocument(uri))
  );
  const documents = documentResults.flatMap((result) => {
    if (result.status === "fulfilled") {
      return [result.value];
    }
    console.error("Failed to open a flow for import repair", result.reason);
    return [];
  });

  const edit = new vscode.WorkspaceEdit();
  const changedDocuments: ChangedDocument[] = [];

  // Compute all replacements without awaiting, so no edit can slip in between
  // reading a document and applying its replacement.
  for (const document of documents) {
    const contents = document.getText();
    let updated: string;
    try {
      updated = rewriteImportPathsAfterMove(contents, {
        flowBefore: mapPathThroughMovesBackwards(document.uri.fsPath, moves),
        flowAfter: document.uri.fsPath,
        moves,
      });
    } catch (error) {
      console.error("Failed to rewrite imports for a flow", error);
      continue;
    }

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
    // A move can arrive while findFiles resolves, after the flow has already
    // reached its final location. The current batch then looks like a no-op;
    // abort instead of dropping it, so the next flush can process the full
    // chain from the original path.
    return hasPendingMoves() ? "aborted" : "applied";
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

  // The editor's change listener consumes a marker when its exact repaired
  // content arrives. Clear anything unconsumed shortly afterwards: a flow with
  // no open editor has no listener, and leaving its marker forever would leak
  // memory and could hide a later edit that happens to restore that content.
  const markerCleanup = setTimeout(
    () => clearImportPathRepairs(changedPaths),
    REPAIR_MARKER_TTL_MS
  );
  markerCleanup.unref?.();

  try {
    await Promise.all(
      changedDocuments
        .filter(({ wasDirty }) => !wasDirty)
        .map(({ document }) => document.save())
    );
  } catch (error) {
    clearTimeout(markerCleanup);
    clearImportPathRepairs(changedPaths);
    throw error;
  }

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
