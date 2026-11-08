import * as path from "path";
import * as vscode from "vscode";
import {
  FileMove,
  getFlowEditsForFileMoves,
  isCodeNodePath,
} from "@flyde/loader/dist/server";

const CONFIG_SECTION = "flyde";
const MODE_SETTING = "updateImportsOnFileMove.enabled";

type UpdateImportsMode = "prompt" | "always" | "never";

export function registerUpdateImportsOnFileMove(): vscode.Disposable {
  let pending = Promise.resolve();

  return vscode.workspace.onDidRenameFiles(({ files }) => {
    pending = pending
      .then(() => updateImportsAfterMove(files))
      .catch((error) => {
        console.error("Failed to update Flyde imports after a file move", error);
        vscode.window.showErrorMessage(
          `Flyde: failed to update imports after moving files. ${error instanceof Error ? error.message : String(error)
          }`
        );
      });
  });
}

async function updateImportsAfterMove(
  files: vscode.FileRenameEvent["files"]
): Promise<void> {
  const mode = vscode.workspace
    .getConfiguration(CONFIG_SECTION)
    .get<UpdateImportsMode>(MODE_SETTING, "prompt");

  if (mode === "never") {
    return;
  }

  const moves = await getRelevantMoves(files);
  if (moves.length === 0) {
    return;
  }

  const affectedFlows = await findAffectedFlows(moves);
  if (affectedFlows.length === 0) {
    return;
  }

  if (mode === "prompt" && !(await confirmUpdate(moves, affectedFlows))) {
    return;
  }

  await updateFlows(affectedFlows, moves);
}

async function getRelevantMoves(
  files: vscode.FileRenameEvent["files"]
): Promise<FileMove[]> {
  const moves: FileMove[] = [];

  for (const { oldUri, newUri } of files) {
    if (
      oldUri.scheme === "file" &&
      newUri.scheme === "file" &&
      (await canContainFlowImports(newUri))
    ) {
      moves.push({ oldPath: oldUri.fsPath, newPath: newUri.fsPath });
    }
  }

  return moves;
}

async function canContainFlowImports(uri: vscode.Uri): Promise<boolean> {
  if (uri.fsPath.endsWith(".flyde") || isCodeNodePath(uri.fsPath)) {
    return true;
  }

  try {
    const { type } = await vscode.workspace.fs.stat(uri);
    return (type & vscode.FileType.Directory) !== 0;
  } catch {
    return false;
  }
}

async function findAffectedFlows(moves: FileMove[]): Promise<vscode.Uri[]> {
  const flows = (
    await vscode.workspace.findFiles("**/*.flyde", "**/node_modules/**")
  ).filter((uri) => uri.scheme === "file");

  const isAffected = await Promise.all(
    flows.map(async (uri) => {
      try {
        const content = await readFlow(uri);
        return getFlowEditsForFileMoves(content, uri.fsPath, moves).length > 0;
      } catch (error) {
        console.warn(`Skipping ${uri.fsPath} while updating Flyde imports`, error);
        return false;
      }
    })
  );

  return flows.filter((_, index) => isAffected[index]);
}

async function readFlow(uri: vscode.Uri): Promise<string> {
  const openDocument = vscode.workspace.textDocuments.find(
    (document) => document.uri.toString() === uri.toString()
  );

  return openDocument
    ? openDocument.getText()
    : Buffer.from(await vscode.workspace.fs.readFile(uri)).toString("utf8");
}

async function confirmUpdate(
  moves: FileMove[],
  flows: vscode.Uri[]
): Promise<boolean> {
  const moved =
    moves.length === 1
      ? `'${path.basename(moves[0].newPath)}'`
      : `${moves.length} moved files`;
  const affected =
    flows.length === 1 ? "1 Flyde flow" : `${flows.length} Flyde flows`;

  const choice = await vscode.window.showInformationMessage(
    `Update imports for ${moved} in ${affected}?`,
    "Yes",
    "No",
    "Always",
    "Never"
  );

  if (choice === "Always" || choice === "Never") {
    const config = vscode.workspace.getConfiguration(CONFIG_SECTION);
    const target =
      config.inspect(MODE_SETTING)?.workspaceValue !== undefined
        ? vscode.ConfigurationTarget.Workspace
        : vscode.ConfigurationTarget.Global;

    await config.update(
      MODE_SETTING,
      choice === "Always" ? "always" : "never",
      target
    );
  }

  return choice === "Yes" || choice === "Always";
}

async function updateFlows(
  flows: vscode.Uri[],
  moves: FileMove[]
): Promise<void> {
  const documents = await Promise.all(
    flows.map((uri) => vscode.workspace.openTextDocument(uri))
  );

  const edit = new vscode.WorkspaceEdit();
  const documentsToSave: vscode.TextDocument[] = [];

  for (const document of documents) {
    const textEdits = getFlowEditsForFileMoves(
      document.getText(),
      document.uri.fsPath,
      moves
    );

    for (const { start, end, newText } of textEdits) {
      edit.replace(
        document.uri,
        new vscode.Range(document.positionAt(start), document.positionAt(end)),
        newText
      );
    }

    if (textEdits.length > 0 && !document.isDirty) {
      documentsToSave.push(document);
    }
  }

  if (edit.size === 0) {
    return;
  }

  if (!(await vscode.workspace.applyEdit(edit))) {
    throw new Error("VS Code could not apply the import updates.");
  }

  await Promise.all(documentsToSave.map((document) => document.save()));
}
