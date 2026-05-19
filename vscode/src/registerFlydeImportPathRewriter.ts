import * as vscode from "vscode";
import {
  isFlydeFile,
  rewriteMovedFlowImports,
  rewriteReferencesToMovedFile,
} from "./flydeImportPathRewriter";

const decoder = new TextDecoder();
const encoder = new TextEncoder();

export function registerFlydeImportPathRewriter(context: vscode.ExtensionContext) {
  const disposable = vscode.workspace.onDidRenameFiles(async (event) => {
    for (const file of event.files) {
      await rewriteMovedFlow(file.oldUri, file.newUri);
      await rewriteWorkspaceReferences(file.oldUri, file.newUri);
    }
  });

  context.subscriptions.push(disposable);
}

async function rewriteMovedFlow(oldUri: vscode.Uri, newUri: vscode.Uri) {
  if (!isFlydeFile(oldUri.fsPath) || !isFlydeFile(newUri.fsPath)) {
    return;
  }

  await rewriteFile(newUri, (content) =>
    rewriteMovedFlowImports(content, oldUri.fsPath, newUri.fsPath)
  );
}

async function rewriteWorkspaceReferences(oldUri: vscode.Uri, newUri: vscode.Uri) {
  const flowUris = await vscode.workspace.findFiles("**/*.flyde", "**/node_modules/**");

  for (const flowUri of flowUris) {
    await rewriteFile(flowUri, (content) =>
      rewriteReferencesToMovedFile(content, flowUri.fsPath, oldUri.fsPath, newUri.fsPath)
    );
  }
}

async function rewriteFile(
  uri: vscode.Uri,
  rewrite: (content: string) => string
) {
  try {
    const content = decoder.decode(await vscode.workspace.fs.readFile(uri));
    const rewritten = rewrite(content);

    if (rewritten !== content) {
      await vscode.workspace.fs.writeFile(uri, encoder.encode(rewritten));
    }
  } catch {
    // A single unreadable or malformed flow should not block the user's file move.
  }
}
