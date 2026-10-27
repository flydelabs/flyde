import * as path from "path";
import * as vscode from "vscode";
import { deserializeFlow, serializeFlow } from "@flyde/loader/dist/server";

export interface RenamedFileEntry {
  oldPath: string;
  newPath: string;
}

function toPosixPath(p: string): string {
  return p.split(path.sep).join("/");
}

function normalizeFsPath(p: string): string {
  const resolved = path.resolve(p);
  return process.platform === "win32" ? resolved.toLowerCase() : resolved;
}

export function mapPathThroughRenames(
  targetPath: string,
  renamedFiles: ReadonlyArray<RenamedFileEntry>,
  direction: "oldToNew" | "newToOld"
): string {
  const resolvedTarget = path.resolve(targetPath);
  const normTarget = normalizeFsPath(resolvedTarget);

  for (const entry of renamedFiles) {
    const fromPath = path.resolve(
      direction === "oldToNew" ? entry.oldPath : entry.newPath
    );
    const toPath = path.resolve(
      direction === "oldToNew" ? entry.newPath : entry.oldPath
    );
    const normFrom = normalizeFsPath(fromPath);

    if (normTarget === normFrom) {
      return toPath;
    }

    const fromPrefix = normFrom.endsWith(path.sep)
      ? normFrom
      : normFrom + path.sep;
    if (normTarget.startsWith(fromPrefix)) {
      const suffix = resolvedTarget.slice(fromPath.length);
      return toPath + suffix;
    }
  }

  return resolvedTarget;
}

export function isRelativeImportPath(importPath: string): boolean {
  if (!importPath || typeof importPath !== "string") {
    return false;
  }
  if (importPath.includes("://") || importPath.startsWith("@")) {
    return false;
  }
  return (
    importPath.startsWith("./") ||
    importPath.startsWith("../") ||
    importPath.endsWith(".flyde") ||
    importPath.endsWith(".flyde.ts") ||
    importPath.endsWith(".flyde.js") ||
    importPath.endsWith(".flyde.mjs") ||
    importPath.endsWith(".flyde.cjs")
  );
}

export function computeUpdatedRelativeImport(
  importPath: string,
  oldFlowPath: string,
  newFlowPath: string,
  renamedFiles: ReadonlyArray<RenamedFileEntry>
): string {
  if (!isRelativeImportPath(importPath)) {
    return importPath;
  }

  const oldFlowDir = path.dirname(path.resolve(oldFlowPath));
  const newFlowDir = path.dirname(path.resolve(newFlowPath));

  const oldTargetAbs = path.resolve(oldFlowDir, importPath);
  const newTargetAbs = mapPathThroughRenames(
    oldTargetAbs,
    renamedFiles,
    "oldToNew"
  );

  if (
    normalizeFsPath(oldFlowDir) === normalizeFsPath(newFlowDir) &&
    normalizeFsPath(oldTargetAbs) === normalizeFsPath(newTargetAbs)
  ) {
    return importPath;
  }

  const relPosix = path.posix.relative(
    toPosixPath(newFlowDir),
    toPosixPath(newTargetAbs)
  );

  return relPosix.startsWith(".") ? relPosix : `./${relPosix}`;
}

export function updateFlowObjectImports(
  flow: any,
  currentFlowPath: string,
  renamedFiles: ReadonlyArray<RenamedFileEntry>
): boolean {
  if (!flow || typeof flow !== "object") {
    return false;
  }

  const oldFlowPath = mapPathThroughRenames(
    currentFlowPath,
    renamedFiles,
    "newToOld"
  );
  let modified = false;

  if (flow.imports && typeof flow.imports === "object") {
    const updatedImports: Record<string, any> = {};
    for (const [impKey, impVal] of Object.entries(flow.imports)) {
      const newKey = computeUpdatedRelativeImport(
        impKey,
        oldFlowPath,
        currentFlowPath,
        renamedFiles
      );
      if (newKey !== impKey) {
        modified = true;
      }
      updatedImports[newKey] = impVal;
    }
    flow.imports = updatedImports;
  }

  function visitVisualNode(node: any) {
    if (!node || !Array.isArray(node.instances)) {
      return;
    }
    for (const instance of node.instances) {
      if (
        instance?.source?.type === "file" &&
        typeof instance.source.data === "string"
      ) {
        const updatedPath = computeUpdatedRelativeImport(
          instance.source.data,
          oldFlowPath,
          currentFlowPath,
          renamedFiles
        );
        if (updatedPath !== instance.source.data) {
          instance.source.data = updatedPath;
          modified = true;
        }
      } else if (
        instance?.source?.type === "inline" &&
        instance.source.data &&
        typeof instance.source.data === "object"
      ) {
        visitVisualNode(instance.source.data);
      }
      if (instance?.node && typeof instance.node === "object") {
        visitVisualNode(instance.node);
      }
    }
  }

  if (flow.node) {
    visitVisualNode(flow.node);
  }

  return modified;
}

export function updateFlowImportsOnRename(
  flowContent: string,
  currentFlowPath: string,
  renamedFiles: ReadonlyArray<RenamedFileEntry>
): string | null {
  try {
    const flow = deserializeFlow(flowContent, currentFlowPath);
    const modified = updateFlowObjectImports(
      flow,
      currentFlowPath,
      renamedFiles
    );
    if (!modified) {
      return null;
    }
    return serializeFlow(flow);
  } catch (err) {
    console.error(`Failed to update imports for flow at ${currentFlowPath}:`, err);
    return null;
  }
}

export function registerFileMoveImportUpdater(
  context: vscode.ExtensionContext
) {
  const disposable = vscode.workspace.onDidRenameFiles(async (event) => {
    const renamedFiles: RenamedFileEntry[] = event.files.map((f) => ({
      oldPath: f.oldUri.fsPath,
      newPath: f.newUri.fsPath,
    }));

    if (renamedFiles.length === 0) {
      return;
    }

    const flydeUris = await vscode.workspace.findFiles(
      "**/*.flyde",
      "**/node_modules/**"
    );

    const workspaceEdit = new vscode.WorkspaceEdit();
    const docsToSave: vscode.TextDocument[] = [];
    let hasEdits = false;

    for (const uri of flydeUris) {
      try {
        const openDoc = vscode.workspace.textDocuments.find(
          (doc) => doc.uri.toString() === uri.toString()
        );
        const wasDirty = openDoc ? openDoc.isDirty : false;
        const document =
          openDoc ?? (await vscode.workspace.openTextDocument(uri));
        const currentText = document.getText();

        const updatedText = updateFlowImportsOnRename(
          currentText,
          uri.fsPath,
          renamedFiles
        );

        if (updatedText !== null && updatedText !== currentText) {
          const fullRange = new vscode.Range(
            document.positionAt(0),
            document.positionAt(currentText.length)
          );
          workspaceEdit.replace(uri, fullRange, updatedText);
          hasEdits = true;
          if (!wasDirty) {
            docsToSave.push(document);
          }
        }
      } catch (err) {
        console.error(`Error updating Flyde imports in ${uri.fsPath}:`, err);
      }
    }

    if (hasEdits) {
      const applied = await vscode.workspace.applyEdit(workspaceEdit);
      if (applied) {
        for (const doc of docsToSave) {
          await doc.save();
        }
      }
    }
  });

  context.subscriptions.push(disposable);
}
