import * as vscode from "vscode";
import * as path from "path";
import * as fs from "fs";

/**
 * Listens for file rename/move events and rewrites relative `source.data`
 * paths inside `.flyde` flow files so that imports keep resolving after a
 * move.
 *
 * Handles two cases:
 *   1. The moved file IS a .flyde flow -> rewrite its own "file" imports so
 *      they remain resolvable from the new location.
 *   2. The moved file is the IMPORTED target -> walk all .flyde flows in the
 *      workspace and update any "file" source whose resolved absolute path
 *      matches the old path.
 */
export function registerFlydeImportRewriter(
  context: vscode.ExtensionContext
): void {
  const sub = vscode.workspace.onDidRenameFiles(async (event) => {
    for (const { oldUri, newUri } of event.files) {
      try {
        await handleSingleRename(oldUri.fsPath, newUri.fsPath);
      } catch (e) {
        // Never throw out of a workspace listener; log and continue.
        console.error("[flyde] import rewrite failed:", e);
      }
    }
  });
  context.subscriptions.push(sub);
}

async function handleSingleRename(
  oldPath: string,
  newPath: string
): Promise<void> {
  // Case 1: the moved file is itself a .flyde flow.
  if (newPath.endsWith(".flyde") && fs.existsSync(newPath)) {
    rewriteSelfImports(oldPath, newPath);
  }

  // Case 2: the moved file is referenced by other .flyde flows.
  const flydeFiles = await vscode.workspace.findFiles(
    "**/*.flyde",
    "**/node_modules/**"
  );
  for (const uri of flydeFiles) {
    rewriteReferencesIn(uri.fsPath, oldPath, newPath);
  }
}

/**
 * Rewrites `data:` values for `source: { type: file, data: ... }` blocks
 * inside the freshly-moved flow file, so each relative path now points at
 * the same absolute target it pointed at before the move.
 */
function rewriteSelfImports(oldFlowPath: string, newFlowPath: string): void {
  const text = safeRead(newFlowPath);
  if (text === null) return;

  const oldDir = path.dirname(oldFlowPath);
  const newDir = path.dirname(newFlowPath);
  if (oldDir === newDir) return;

  const updated = mutateFileSourceData(text, (relPath) => {
    const absTarget = path.resolve(oldDir, relPath);
    const newRel = toPosixRel(path.relative(newDir, absTarget));
    return newRel === relPath ? null : newRel;
  });

  if (updated !== null) safeWrite(newFlowPath, updated);
}

/**
 * Inside `flowPath`, rewrites any `source: { type: file, data: ... }` whose
 * resolved absolute target equals `oldTargetPath` to instead point at
 * `newTargetPath`.
 */
function rewriteReferencesIn(
  flowPath: string,
  oldTargetPath: string,
  newTargetPath: string
): void {
  const text = safeRead(flowPath);
  if (text === null) return;

  const flowDir = path.dirname(flowPath);
  const updated = mutateFileSourceData(text, (relPath) => {
    const abs = path.resolve(flowDir, relPath);
    if (!samePath(abs, oldTargetPath)) return null;
    return toPosixRel(path.relative(flowDir, newTargetPath));
  });

  if (updated !== null) safeWrite(flowPath, updated);
}

/**
 * Walks YAML text line-by-line looking for `source:` blocks of `type: file`
 * and applies `transform` to the `data:` value. Returns the new text or null
 * if nothing changed. Preserves indentation, quoting style, and comments by
 * editing only the data portion of matched lines.
 */
function mutateFileSourceData(
  text: string,
  transform: (currentRelPath: string) => string | null
): string | null {
  const lines = text.split(/\r?\n/);
  let changed = false;

  // State machine: when we see a `source:` line, look at subsequent lines
  // (more indented) for a `type: file` and a `data: <path>` pair.
  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(/^(\s*)source:\s*$/);
    if (!m) continue;
    const baseIndent = m[1].length;

    // Find type and data within this source block.
    let typeIdx = -1;
    let dataIdx = -1;
    for (let j = i + 1; j < lines.length; j++) {
      const lm = lines[j].match(/^(\s*)(\S.*)$/);
      if (!lm) continue;
      const indent = lm[1].length;
      if (indent <= baseIndent) break;
      if (/^type:\s*/.test(lm[2])) typeIdx = j;
      else if (/^data:\s*/.test(lm[2])) dataIdx = j;
      if (typeIdx !== -1 && dataIdx !== -1) break;
    }
    if (typeIdx === -1 || dataIdx === -1) continue;

    const typeMatch = lines[typeIdx].match(/^\s*type:\s*"?([^"\s]+)"?\s*$/);
    if (!typeMatch || typeMatch[1] !== "file") continue;

    const dataMatch = lines[dataIdx].match(
      /^(\s*data:\s*)(['"]?)(.+?)\2(\s*)$/
    );
    if (!dataMatch) continue;
    const [, prefix, quote, value, trailing] = dataMatch;

    const next = transform(value);
    if (next === null || next === value) continue;

    lines[dataIdx] = `${prefix}${quote}${next}${quote}${trailing}`;
    changed = true;
  }

  return changed ? lines.join("\n") : null;
}

function toPosixRel(p: string): string {
  const norm = p.split(path.sep).join("/");
  return norm.startsWith(".") || norm.startsWith("/") ? norm : `./${norm}`;
}

function samePath(a: string, b: string): boolean {
  const norm = (s: string) => path.resolve(s);
  return process.platform === "win32"
    ? norm(a).toLowerCase() === norm(b).toLowerCase()
    : norm(a) === norm(b);
}

function safeRead(p: string): string | null {
  try {
    return fs.readFileSync(p, "utf-8");
  } catch {
    return null;
  }
}

function safeWrite(p: string, content: string): void {
  try {
    fs.writeFileSync(p, content, "utf-8");
  } catch (e) {
    console.error("[flyde] failed to write", p, e);
  }
}
