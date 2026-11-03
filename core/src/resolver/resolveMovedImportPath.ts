import * as path from "path";
import * as fs from "fs";

export interface ImportRewriteResult {
  resolvedAbsolutePath: string | null;
  updatedImportSpecifier: string;
}

/**
 * Resolves a potentially broken relative import specifier after either the importing
 * `.flyde` flow or the target node file has been moved to another folder within `workspaceRoot`.
 */
export function resolveMovedImportPath(
  currentFlowFilePath: string,
  importSpecifier: string,
  workspaceRoot: string,
  fileExists: (absPath: string) => boolean = fs.existsSync
): ImportRewriteResult {
  const flowDir = path.dirname(path.resolve(currentFlowFilePath));
  const directCandidate = path.resolve(flowDir, importSpecifier);

  if (fileExists(directCandidate)) {
    return {
      resolvedAbsolutePath: directCandidate,
      updatedImportSpecifier: importSpecifier.replace(/\\/g, "/"),
    };
  }

  const targetBasename = path.basename(importSpecifier);
  const rootAbs = path.resolve(workspaceRoot);
  const matches: string[] = [];

  function walk(dir: string) {
    let entries: fs.Dirent[] = [];
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries) {
      if (entry.name === "node_modules" || entry.name.startsWith(".")) continue;
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(full);
      } else if (entry.isFile() && entry.name === targetBasename) {
        matches.push(full);
      }
    }
  }

  walk(rootAbs);
  if (matches.length === 0) {
    return { resolvedAbsolutePath: null, updatedImportSpecifier: importSpecifier };
  }

  // Pick closest match by relative path depth from currentFlowFilePath
  matches.sort(
    (a, b) =>
      path.relative(flowDir, a).split(path.sep).length -
      path.relative(flowDir, b).split(path.sep).length
  );
  const best = matches[0];
  let rel = path.relative(flowDir, best).replace(/\\/g, "/");
  if (!rel.startsWith(".")) {
    rel = "./" + rel;
  }
  return {
    resolvedAbsolutePath: best,
    updatedImportSpecifier: rel,
  };
}
