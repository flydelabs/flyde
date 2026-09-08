import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";
import { isMap, isSeq, parseDocument } from "yaml";

/**
 * Keeps `.flyde` imports working when files are moved or renamed in VS Code.
 * Handles both directions:
 * - a file imported by `.flyde` flows was moved (update the referencing flows)
 * - a `.flyde` flow itself was moved (update its own relative imports)
 */
export function registerFlydeImportUpdater(context: vscode.ExtensionContext) {
  const sub = vscode.workspace.onDidRenameFiles(async (event) => {
    try {
      await updateImportsForRenameEvent(event);
    } catch (e) {
      // Never throw out of a workspace listener
      console.error("[flyde] failed to update imports after rename:", e);
    }
  });
  context.subscriptions.push(sub);
}

export interface RenameEventLike {
  files: ReadonlyArray<{ oldUri: vscode.Uri; newUri: vscode.Uri }>;
}

export async function updateImportsForRenameEvent(
  event: RenameEventLike
): Promise<string[]> {
  const flydeFiles = (
    await vscode.workspace.findFiles("**/*.flyde", "**/node_modules/**")
  ).map((uri) => uri.fsPath);

  const updated = new Set<string>();
  for (const file of event.files) {
    for (const changed of updateImportsAfterRename(
      file.oldUri.fsPath,
      file.newUri.fsPath,
      flydeFiles
    )) {
      updated.add(changed);
    }
  }
  return [...updated];
}

/**
 * Rewrites relative `source.data` import paths in the given `.flyde` files so
 * they keep resolving after `oldPath` was renamed/moved to `newPath`.
 * Exported for tests; returns the list of files that were modified.
 */
export function updateImportsAfterRename(
  oldPath: string,
  newPath: string,
  flydeFiles: string[]
): string[] {
  const updated: string[] = [];

  // Case 1: the moved file is referenced by other flows
  for (const flydeFile of flydeFiles) {
    const text = safeRead(flydeFile);
    if (text === null) {
      continue;
    }

    const flowDir = path.dirname(flydeFile);
    const next = updateFlowImports(text, (relImport) => {
      const abs = path.resolve(flowDir, relImport);
      return samePath(abs, oldPath)
        ? toRelImport(path.relative(flowDir, newPath))
        : undefined;
    });
    if (next !== null) {
      safeWrite(flydeFile, next);
      updated.push(flydeFile);
    }
  }

  // Case 2: the moved file is itself a flow; fix its own imports so they
  // still point at the same absolute targets from the new location
  if (newPath.endsWith(".flyde") && fs.existsSync(newPath)) {
    const oldDir = path.dirname(oldPath);
    const newDir = path.dirname(newPath);
    if (oldDir !== newDir) {
      const text = safeRead(newPath);
      if (text !== null) {
        const next = updateFlowImports(text, (relImport) => {
          const abs = path.resolve(oldDir, relImport);
          const next = toRelImport(path.relative(newDir, abs));
          return next !== relImport ? next : undefined;
        });
        if (next !== null) {
          safeWrite(newPath, next);
          updated.push(newPath);
        }
      }
    }
  }

  return updated;
}

/**
 * Applies `transform` to every `source.data` value of `type: file` imports in
 * a serialized flow. Returns the updated text, or null when nothing changed.
 * Uses a YAML document so comments and formatting are preserved.
 */
export function updateFlowImports(
  flowText: string,
  transform: (currentRelImport: string) => string | undefined
): string | null {
  let doc;
  try {
    doc = parseDocument(flowText);
  } catch {
    return null;
  }
  if (doc.errors.length > 0) {
    return null;
  }

  let changed = false;
  const node = doc.get("node");
  if (isMap(node)) {
    const instances = node.get("instances");
    if (isSeq(instances)) {
      for (const instance of instances.items) {
        if (!isMap(instance)) {
          continue;
        }
        const source = instance.get("source");
        if (!isMap(source)) {
          continue;
        }
        if (source.get("type") !== "file") {
          continue;
        }
        const data = source.get("data");
        if (typeof data !== "string") {
          continue;
        }
        const next = transform(data);
        if (next !== undefined && next !== data) {
          source.set("data", next);
          changed = true;
        }
      }
    }
  }
  return changed ? doc.toString() : null;
}

function toRelImport(rel: string): string {
  const posix = rel.split(path.sep).join("/");
  return posix.startsWith(".") ? posix : `./${posix}`;
}

function samePath(a: string, b: string): boolean {
  const norm = (s: string) => path.resolve(s);
  return process.platform === "win32"
    ? norm(a).toLowerCase() === norm(b).toLowerCase()
    : norm(a) === norm(b);
}

function safeRead(filePath: string): string | null {
  try {
    return fs.readFileSync(filePath, "utf-8");
  } catch {
    return null;
  }
}

function safeWrite(filePath: string, content: string): void {
  try {
    fs.writeFileSync(filePath, content, "utf-8");
  } catch (e) {
    console.error(`[flyde] failed to write ${filePath}:`, e);
  }
}
