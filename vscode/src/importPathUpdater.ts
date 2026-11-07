import * as vscode from "vscode";
import {
  RenamedPathEntry,
  rewriteFlowImportsAfterMove,
} from "@flyde/loader/dist/server";

interface WorkspaceFlowUpdateBatch {
  flowUris: vscode.Uri[];
  renamedEntries: ReadonlyArray<RenamedPathEntry>;
}

// Subscribes to workspace file rename events to keep relative .flyde imports valid.
export function registerFlydeImportPathUpdater(
  context: vscode.ExtensionContext
): void {
  const disposable = vscode.workspace.onDidRenameFiles(async (event) => {
    await handleWorkspaceFileRename(event);
  });
  context.subscriptions.push(disposable);
}

async function handleWorkspaceFileRename(
  event: vscode.FileRenameEvent
): Promise<void> {
  const renamedEntries = toRenamedPathEntries(event);
  if (renamedEntries.length === 0) {
    return;
  }
  const flowUris = await collectWorkspaceFlydeUris(event);
  await updateFlowFilesBatch({ flowUris, renamedEntries });
}

function toRenamedPathEntries(
  event: vscode.FileRenameEvent
): RenamedPathEntry[] {
  return event.files.map((item) => ({
    oldPath: item.oldUri.fsPath,
    newPath: item.newUri.fsPath,
  }));
}

async function collectWorkspaceFlydeUris(
  event: vscode.FileRenameEvent
): Promise<vscode.Uri[]> {
  const discovered = await vscode.workspace.findFiles(
    "**/*.flyde",
    "**/node_modules/**"
  );
  const directMoved = event.files
    .map((item) => item.newUri)
    .filter((uri) => uri.fsPath.endsWith(".flyde"));

  const byPath = new Map<string, vscode.Uri>();
  for (const uri of [...discovered, ...directMoved]) {
    byPath.set(uri.fsPath, uri);
  }
  return Array.from(byPath.values());
}

async function updateFlowFilesBatch(
  batch: WorkspaceFlowUpdateBatch
): Promise<void> {
  for (const flowUri of batch.flowUris) {
    await updateSingleFlowFile(flowUri, batch);
  }
}

async function updateSingleFlowFile(
  flowUri: vscode.Uri,
  batch: WorkspaceFlowUpdateBatch
): Promise<void> {
  try {
    const rawBytes = await vscode.workspace.fs.readFile(flowUri);
    const rawText = Buffer.from(rawBytes).toString("utf8");
    const rewritten = rewriteFlowImportsAfterMove(rawText, {
      currentFlowPath: flowUri.fsPath,
      renamedEntries: batch.renamedEntries,
    });
    if (rewritten.changed) {
      await vscode.workspace.fs.writeFile(
        flowUri,
        Buffer.from(rewritten.content, "utf8")
      );
    }
  } catch (error) {
    console.error(`Failed to update imports in ${flowUri.fsPath}:`, error);
  }
}
