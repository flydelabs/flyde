import { existsSync, readdirSync } from "fs";
import { basename, dirname, resolve } from "path";

/**
 * Recovery logic for Flyde file-sourced imports whose stored relative path no
 * longer resolves (e.g. after the imported file was moved to another folder).
 *
 * See flyde issue #112: "when I moved the imported file to a different folder,
 * the import broke".
 *
 * Strategy:
 *  1. Fast path: if the stored path resolves from the flow's directory, keep it.
 *  2. Otherwise, locate the project root (nearest ancestor with package.json or
 *     .git) and search it for files sharing the stored path's basename.
 *  3. Among candidates, prefer the one whose path suffix best matches the
 *     stored relative path (most segments in common, counted from the end).
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
    if (existsSync(dir + "/package.json") || existsSync(dir + "/.git")) {
      return dir;
    }
    const parent = dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return resolve(startDir);
}

function walk(dir: string, targetBase: string, hits: string[], depth: number): void {
  if (hits.length >= MAX_HITS || depth > MAX_DEPTH) return;
  let entries;
  try {
    entries = readdirSync(dir, { withFileTypes: true });
  } catch {
    return; // unreadable dir — ignore
  }
  for (const entry of entries) {
    if (hits.length >= MAX_HITS) return;
    if (entry.name.startsWith(".") || SKIP_DIRS.has(entry.name)) continue;
    const full = dir + "/" + entry.name;
    if (entry.isDirectory()) {
      walk(full, targetBase, hits, depth + 1);
    } else if (entry.isFile() && entry.name === targetBase) {
      hits.push(full);
    }
  }
}

function suffixScore(candidatePath: string, storedParts: string[]): number {
  const candidateParts = candidatePath.split("/");
  let score = 0;
  for (let i = 1; i <= storedParts.length; i++) {
    const storedSeg = storedParts[storedParts.length - i];
    const candSeg = candidateParts[candidateParts.length - i];
    if (storedSeg === undefined || candSeg === undefined || storedSeg !== candSeg) {
      break;
    }
    score += i;
  }
  return score;
}

/**
 * Returns an absolute path for a file-sourced import. If the stored relative
 * path resolves, it is returned untouched. If it is broken (file moved), the
 * project tree is searched for a file with the same basename and the best
 * suffix match is returned. Returns null when nothing plausible is found.
 */
export function recoverMovedFileSource(
  fullFlowPath: string,
  storedPath: string
): string | null {
  const direct = resolve(dirname(fullFlowPath), storedPath);
  if (existsSync(direct)) return direct;

  const normalizedStored = storedPath.replace(/\\/g, "/");
  const root = findProjectRoot(dirname(fullFlowPath));
  const hits: string[] = [];
  walk(root, basename(normalizedStored), hits, 0);
  if (hits.length === 0) return null;

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
