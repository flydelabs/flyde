import * as path from "path";
import * as vscode from "vscode";
import { deserializeFlow, serializeFlow } from "@flyde/loader/dist/server";

function normalizeFsPath(filePath: string): string {
  return path.resolve(filePath);
}

function toPosixPath(filePath: string): string {
  return filePath.split(path.sep).join(path.posix.sep);
}

function relativeImportPath(fromFilePath: string, toFilePath: string): string {
  const relative = toPosixPath(
    path.relative(path.dirname(fromFilePath), toFilePath)
  );

  if (relative.startsWith(".")) {
    return relative;
  }

  return `./${relative}`;
}

function importPathMatchesFile(
  flowPath: string,
  importPath: string,
  movedFromPath: string
): boolean {
  if (!importPath.startsWith(".")) {
    return false;
  }

  const resolvedImportPath = normalizeFsPath(
    path.resolve(path.dirname(flowPath), importPath)
  );

  return resolvedImportPath === normalizeFsPath(movedFromPath);
}

export function updateMovedFlydeImportsInText(
  flowText: string,
  flowPath: string,
  renamedFiles: Array<{ oldPath: string; newPath: string }>
): string | undefined {
  const flow = deserializeFlow(flowText, flowPath);
  const imports = flow.imports ?? {};
  let changed = false;

  for (const [oldImportPath, importedNodeIds] of Object.entries(imports)) {
    const movedFile = renamedFiles.find(({ oldPath }) =>
      importPathMatchesFile(flowPath, oldImportPath, oldPath)
    );

    if (!movedFile) {
      continue;
    }

    const newImportPath = relativeImportPath(flowPath, movedFile.newPath);
    delete imports[oldImportPath];
    imports[newImportPath] = importedNodeIds;
    changed = true;
  }

  if (!changed) {
    return undefined;
  }

  flow.imports = imports;
  return serializeFlow(flow);
}

export function registerMovedFlydeImportUpdater(
  context: vscode.ExtensionContext,
  outputChannel?: vscode.OutputChannel
) {
  context.subscriptions.push(
    vscode.workspace.onDidRenameFiles(async ({ files }) => {
      const renamedFlydeFiles = files
        .filter(
          ({ oldUri, newUri }) =>
            oldUri.scheme === "file" &&
            newUri.scheme === "file" &&
            oldUri.fsPath.endsWith(".flyde") &&
            newUri.fsPath.endsWith(".flyde")
        )
        .map(({ oldUri, newUri }) => ({
          oldPath: oldUri.fsPath,
          newPath: newUri.fsPath,
        }));

      if (renamedFlydeFiles.length === 0) {
        return;
      }

      const flydeFiles = await vscode.workspace.findFiles(
        "**/*.flyde",
        "**/node_modules/**"
      );

      for (const file of flydeFiles) {
        try {
          const document = await vscode.workspace.openTextDocument(file);
          const updatedText = updateMovedFlydeImportsInText(
            document.getText(),
            file.fsPath,
            renamedFlydeFiles
          );

          if (updatedText === undefined) {
            continue;
          }

          const edit = new vscode.WorkspaceEdit();
          edit.replace(
            file,
            new vscode.Range(0, 0, document.lineCount, 0),
            updatedText
          );
          await vscode.workspace.applyEdit(edit);
          await document.save();
        } catch (error) {
          outputChannel?.appendLine(
            `Failed updating Flyde imports in ${file.fsPath}: ${error}`
          );
        }
      }
    })
  );
}

