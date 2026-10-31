import * as vscode from "vscode";
import {
  FileMove,
  mapPathThroughMovesBackwards,
  rewriteImportPathsAfterMove,
} from "@flyde/loader";
import {
  clearImportPathRepairs,
  markImportPathRepairs,
} from "./importPathRepairMarkers";

const RENAME_COALESCE_MS = 150;
const REPAIR_MARKER_TTL_MS = 1000;

// A repair marker is valid only for the generation that marked it. An older
// batch's cleanup timer must not delete a newer batch's marker for the same
// file, or that newer repair would be posted as an external edit.
const repairGenerationByPath = new Map<string, number>();

const flowFileMoveListeners = new Set<
  (notice: FlowFileMovesNotice) => void
>();

export interface FlowFileMovesNotice {
  moves: FileMove[];
}

/**
 * Notifies open editors after a move batch has been reflected on disk. This
 * carries the moves themselves, not only the paths that happened to be in a
 * TextDocument, so unsaved instances and retained paste/undo state can be
 * repaired too.
 */
export const onFlowFileMoves = (
  listener: (notice: FlowFileMovesNotice) => void
) => {
  flowFileMoveListeners.add(listener);
  return () => {
    flowFileMoveListeners.delete(listener);
  };
};

const notifyFlowFileMoves = (moves: FileMove[]) => {
  flowFileMoveListeners.forEach((listener) => {
    try {
      listener({ moves });
    } catch (error) {
      // A disposed or broken panel must not keep the repair loop in its
      // `repairing` state or hide the move from the remaining editors.
      console.error("Failed to notify an editor about moved files", error);
    }
  });
};

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
  let flowUris: vscode.Uri[];
  try {
    flowUris = await vscode.workspace.findFiles(
      "**/*.flyde",
      "**/node_modules/**"
    );
  } catch (error) {
    if (hasPendingMoves()) {
      return "aborted";
    }
    throw error;
  }

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
  const generations = new Map<string, number>();
  for (const filePath of changedPaths) {
    const generation = (repairGenerationByPath.get(filePath) ?? 0) + 1;
    repairGenerationByPath.set(filePath, generation);
    generations.set(filePath, generation);
  }
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
    if (hasPendingMoves()) {
      return "aborted";
    }
    throw error;
  }

  if (!applied) {
    console.error("Failed to apply import path updates after rename");
    clearImportPathRepairs(changedPaths);
    // The move that caused this batch may have arrived while applyEdit was
    // outstanding and invalidated its URIs. Requeue instead of dropping the
    // unapplied chain; the next batch sees the newer move too.
    return hasPendingMoves() ? "aborted" : "failed";
  }

  // Now that the edit is applied, bind each marker to the exact document
  // version it produced. A later external edit that happens to restore the
  // same contents is not mistaken for this repair.
  markImportPathRepairs(
    changedDocuments.map(({ document, updated }) => ({
      filePath: document.uri.fsPath,
      contents: updated,
      version: document.version,
    }))
  );
  // Every editor listener checks a marker when its exact repaired content
  // arrives. Clear anything unconsumed shortly afterwards: a flow with no open
  // editor has no listener, and leaving its marker forever would leak memory
  // and could hide a later edit that happens to restore that content.
  const markerCleanup = setTimeout(() => {
    const stalePaths = changedPaths.filter(
      (filePath) =>
        repairGenerationByPath.get(filePath) === generations.get(filePath)
    );
    clearImportPathRepairs(stalePaths);
    stalePaths.forEach((filePath) => repairGenerationByPath.delete(filePath));
  }, REPAIR_MARKER_TTL_MS);
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
    let result: RepairResult | undefined;
    try {
      result = await repairImportPaths(
        moves,
        () => pendingMoves.length > 0
      );

      if (result === "aborted") {
        pendingMoves.unshift(...moves);
      }
    } catch (error) {
      console.error("Failed to update import paths after rename", error);
    } finally {
      if (result === "applied") {
        notifyFlowFileMoves(moves);
      }
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
