import * as vscode from "vscode";

import { deserializeFlow, serializeFlow } from "@flyde/loader/dist/server";
import { updateFlowFileReferences } from "./flowFileReferences";

const FLYDE_FILE_GLOB = "**/*.flyde";
const FLYDE_EXCLUDE_GLOB = "**/{node_modules,.git,out,dist,webview-dist}/**";

const getOpenDocument = (uri: vscode.Uri) => {
  return vscode.workspace.textDocuments.find(
    (document) => document.uri.toString() === uri.toString()
  );
};

const replaceDocumentText = async (
  document: vscode.TextDocument,
  nextText: string
) => {
  const edit = new vscode.WorkspaceEdit();
  const fullRange = new vscode.Range(
    document.positionAt(0),
    document.positionAt(document.getText().length)
  );

  edit.replace(document.uri, fullRange, nextText);
  await vscode.workspace.applyEdit(edit);
};

export const updateImportsOnFileMove = async (
  event: vscode.FileRenameEvent
) => {
  const renames = event.files.map((file) => ({
    oldPath: file.oldUri.fsPath,
    newPath: file.newUri.fsPath,
  }));

  if (renames.length === 0) {
    return;
  }

  const flowUris = await vscode.workspace.findFiles(
    FLYDE_FILE_GLOB,
    FLYDE_EXCLUDE_GLOB
  );

  let updatedCount = 0;

  for (const flowUri of flowUris) {
    try {
      const openDocument = getOpenDocument(flowUri);
      const raw =
        openDocument?.getText() ??
        new TextDecoder().decode(await vscode.workspace.fs.readFile(flowUri));
      const flow = deserializeFlow(raw, flowUri.fsPath);

      if (!updateFlowFileReferences(flow, flowUri.fsPath, renames)) {
        continue;
      }

      const serialized = serializeFlow(flow);

      if (openDocument) {
        await replaceDocumentText(openDocument, serialized);
      } else {
        await vscode.workspace.fs.writeFile(
          flowUri,
          new TextEncoder().encode(serialized)
        );
      }
      updatedCount += 1;
    } catch (error) {
      console.warn(`Failed to update Flyde imports in ${flowUri.fsPath}`, error);
    }
  }

  if (updatedCount > 0) {
    const suffix = updatedCount === 1 ? "file" : "files";
    vscode.window.showInformationMessage(
      `Updated Flyde imports in ${updatedCount} ${suffix}.`
    );
  }
};
