import type * as vscodeTypes from "vscode";
import * as path from "path";
import * as yaml from "yaml";

export interface FileRename {
  oldUri: vscodeTypes.Uri;
  newUri: vscodeTypes.Uri;
}

/**
 * Computes updated YAML text for a .flyde flow file when files or folders have been moved/renamed.
 * Returns the updated content string if changes were made, or null if no imports were affected.
 */
export function computeUpdatedImports(
  flowContent: string,
  flowFilePath: string,
  renames: { oldPath: string; newPath: string }[]
): string | null {
  let doc: yaml.Document.Parsed;
  try {
    doc = yaml.parseDocument(flowContent);
  } catch {
    return null;
  }

  const importsNode = doc.get("imports") as any;
  if (!importsNode || typeof importsNode.toJSON !== "function") {
    return null;
  }

  const importsObj = importsNode.toJSON();
  if (!importsObj || typeof importsObj !== "object") {
    return null;
  }

  const flowDir = path.dirname(flowFilePath);
  let changed = false;

  // Check if this flow file itself was moved
  const selfRename = renames.find(
    (r) => path.normalize(r.oldPath) === path.normalize(flowFilePath)
  );

  for (const importKey of Object.keys(importsObj)) {
    // Only process relative file imports
    if (!importKey.startsWith(".")) {
      continue;
    }

    const value = importsNode.get(importKey);

    if (selfRename) {
      // The flow file itself was moved from oldPath to newPath.
      // Its imports were relative to oldDir and now must be relative to newDir.
      const oldFlowDir = path.dirname(selfRename.oldPath);
      const newFlowDir = path.dirname(selfRename.newPath);

      // Resolve what the import pointed to from the old location
      const absTarget = path.resolve(oldFlowDir, importKey);
      let newRel = path.relative(newFlowDir, absTarget).split(path.sep).join("/");
      if (!newRel.startsWith(".") && !newRel.startsWith("/")) {
        newRel = "./" + newRel;
      }

      if (newRel !== importKey) {
        importsNode.delete(importKey);
        importsNode.set(newRel, value);
        changed = true;
      }
    } else {
      // Another file or directory was moved. Check if this import targeted that file/directory.
      const absTarget = path.resolve(flowDir, importKey);

      for (const rename of renames) {
        const normOld = path.normalize(rename.oldPath);
        const normNew = path.normalize(rename.newPath);
        const normTarget = path.normalize(absTarget);

        let match = false;
        let newTarget = "";

        // Direct file match
        if (normTarget === normOld) {
          match = true;
          newTarget = normNew;
        } else if (
          // Extensionless match (e.g. import was './sub/code' and file was 'sub/code.flyde.ts' or 'sub/code.ts')
          normTarget.replace(/\.(flyde|flyde\.ts|ts|js)$/, "") ===
          normOld.replace(/\.(flyde|flyde\.ts|ts|js)$/, "")
        ) {
          match = true;
          const oldExt = path.extname(normOld);
          const hasExt =
            importKey.endsWith(oldExt) ||
            importKey.endsWith(".ts") ||
            importKey.endsWith(".flyde");
          newTarget = hasExt
            ? normNew
            : normNew.replace(/\.(flyde|flyde\.ts|ts|js)$/, "");
        } else if (
          // Directory match (a parent folder was moved/renamed)
          normTarget.startsWith(normOld + path.sep)
        ) {
          match = true;
          newTarget = normNew + normTarget.slice(normOld.length);
        }

        if (match) {
          let newRel = path.relative(flowDir, newTarget).split(path.sep).join("/");
          if (!newRel.startsWith(".") && !newRel.startsWith("/")) {
            newRel = "./" + newRel;
          }

          if (newRel !== importKey) {
            importsNode.delete(importKey);
            importsNode.set(newRel, value);
            changed = true;
            break;
          }
        }
      }
    }
  }

  return changed ? doc.toString() : null;
}

/**
 * Handles VS Code workspace file rename events and updates all affected .flyde imports.
 */
export async function handleFileRenames(
  event: vscodeTypes.FileRenameEvent
): Promise<void> {
  const vscode = require("vscode");
  const renames = event.files.map((f: vscodeTypes.FileRenameEvent["files"][number]) => ({
    oldPath: f.oldUri.fsPath,
    newPath: f.newUri.fsPath,
  }));

  // Find all .flyde files in the workspace
  const flydeFiles = await vscode.workspace.findFiles("**/*.flyde");

  const workspaceEdit = new vscode.WorkspaceEdit();
  let editCount = 0;

  for (const fileUri of flydeFiles) {
    try {
      const document = await vscode.workspace.openTextDocument(fileUri);
      const text = document.getText();
      const updatedText = computeUpdatedImports(text, fileUri.fsPath, renames);

      if (updatedText !== null) {
        const fullRange = new vscode.Range(
          document.positionAt(0),
          document.positionAt(text.length)
        );
        workspaceEdit.replace(fileUri, fullRange, updatedText);
        editCount++;
      }
    } catch (e) {
      console.error(`[Flyde] Error updating imports for ${fileUri.fsPath}:`, e);
    }
  }

  if (editCount > 0) {
    const success = await vscode.workspace.applyEdit(workspaceEdit);
    if (success) {
      vscode.window.showInformationMessage(
        `Flyde: Updated imports across ${editCount} flow(s) after file move.`
      );
    }
  }
}
