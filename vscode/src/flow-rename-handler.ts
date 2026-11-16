import * as vscode from "vscode";
import { deserializeFlow, serializeFlow } from "@flyde/loader/dist/server";
import {
  FileRename,
  pathBeforeRename,
  remapFlowReferences,
} from "./flow-reference-remap";

async function updateFlowFile(
  uri: vscode.Uri,
  renames: readonly FileRename[]
): Promise<void> {
  const flowPathAfter = uri.fsPath;
  const flowPathBefore = pathBeforeRename(flowPathAfter, renames);

  const bytes = await vscode.workspace.fs.readFile(uri);
  const contents = Buffer.from(bytes).toString("utf8");

  let flow;
  try {
    flow = deserializeFlow(contents, flowPathAfter);
  } catch {
    // not a parseable flow file - leave it untouched
    return;
  }

  const { flow: updated, changed } = remapFlowReferences(
    flow,
    flowPathBefore,
    flowPathAfter,
    renames
  );
  if (!changed) {
    return;
  }

  await vscode.workspace.fs.writeFile(
    uri,
    Buffer.from(serializeFlow(updated), "utf8")
  );
}

/**
 * Keeps flow imports working when files or folders are renamed/moved in
 * the explorer: whenever a rename happens, every `.flyde` file in the
 * workspace gets its file references (instance sources of type "file"
 * and the legacy `imports` map) rewritten so they keep pointing at the
 * same files. This also covers the flow file itself being moved, in
 * which case its relative references are re-based to its new folder.
 */
export function registerFlowRenameHandler(
  context: vscode.ExtensionContext
): void {
  const disposable = vscode.workspace.onDidRenameFiles(async (event) => {
    const renames: FileRename[] = event.files.map(({ oldUri, newUri }) => ({
      oldPath: oldUri.fsPath,
      newPath: newUri.fsPath,
    }));
    if (renames.length === 0) {
      return;
    }

    try {
      const flowUris = await vscode.workspace.findFiles(
        "**/*.flyde",
        "**/node_modules/**"
      );
      await Promise.all(
        flowUris.map((uri) => updateFlowFile(uri, renames))
      );
    } catch (err) {
      console.error(
        "Flyde: failed to update flow references after rename",
        err
      );
    }
  });

  context.subscriptions.push(disposable);
}
