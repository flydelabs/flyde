import { existsSync, readdirSync } from "fs";
import { basename, dirname, resolve } from "path";

/**
 * Fallback for file-sourced imports whose stored relative path no longer
 * resolves (e.g. the imported file was moved outside VS Code). Primary fix for
 * Explorer renames lives in `getReferenceEditsForRename` + onWillRenameFiles.
 *
 * Strategy:
 *  1. If the stored path still exists, return it.
 *  2. Otherwise walk the nearest project root for matching basenames.
 *  3. Prefer the candidate whose path suffix best matches the stored path.
 */

const SKIP_DIRS = new Set([
  "node_modules",
  ".git",
  "dist",
  "build",
  "out",
  ".flyde",
  "coverage",
]);

const MAX_DEPTH = 8;
const MAX_HITS = 50;

function findProjectRoot(startDir: string): string {
  let dir = resolve(startDir);
  for (let i = 0; i < MAX_DEPTH; i++) {
    if (existsSync(resolve(dir, "package.json")) || existsSync(resolve(dir, ".git"))) {
      return dir;
    }
    const parent = dirname(dir);
    if (parent === dir) {
      break;
    }
    dir = parent;
  }
  return resolve(startDir);
}

function walk(
  dir: string,
  targetBase: string,
  hits: string[],
  depth: number
): void {
  if (hits.length >= MAX_HITS || depth > MAX_DEPTH) {
    return;
  }
  let entries;
  try {
    entries = readdirSync(dir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const entry of entries) {
    if (hits.length >= MAX_HITS) {
      return;
    }
    if (entry.name.startsWith(".") || SKIP_DIRS.has(entry.name)) {
      continue;
    }
    const full = resolve(dir, entry.name);
    if (entry.isDirectory()) {
      walk(full, targetBase, hits, depth + 1);
    } else if (entry.isFile() && entry.name === targetBase) {
      hits.push(full);
    }
  }
}

function suffixScore(candidatePath: string, storedParts: string[]): number {
  const candidateParts = candidatePath.replace(/\\/g, "/").split("/");
  let score = 0;
  for (let i = 1; i <= storedParts.length; i++) {
    const storedSeg = storedParts[storedParts.length - i];
    const candSeg = candidateParts[candidateParts.length - i];
    if (
      storedSeg === undefined ||
      candSeg === undefined ||
      storedSeg !== candSeg
    ) {
      break;
    }
    score += i;
  }
  return score;
}

/**
 * Returns an absolute path for a file-sourced import, or null if nothing
 * plausible is found after a move outside the rewrite path.
 */
export function recoverMovedFileSource(
  fullFlowPath: string,
  storedPath: string
): string | null {
  const direct = resolve(dirname(fullFlowPath), storedPath);
  if (existsSync(direct)) {
    return direct;
  }

  const normalizedStored = storedPath.replace(/\\/g, "/");
  const root = findProjectRoot(dirname(fullFlowPath));
  const hits: string[] = [];
  walk(root, basename(normalizedStored), hits, 0);
  if (hits.length === 0) {
    return null;
  }

  const storedParts = normalizedStored.split("/").filter(Boolean);
  let best: string | null = null;
  let bestScore = -1;
  for (const hit of hits) {
    const score = suffixScore(hit, storedParts);
    if (score > bestScore) {
      bestScore = score;
      best = hit;
    }
  }
  return best;
}
