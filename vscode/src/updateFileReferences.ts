import type { FlydeFlow, VisualNode } from "@flyde/core";
import * as path from "path";

export interface FileMove {
  oldPath: string;
  newPath: string;
}

/**
 * Apply a batch of simultaneous renames/moves to an absolute path,
 * choosing the most specific (longest) matching source path.
 */
export function applyMove(
  absolutePath: string,
  moves: readonly FileMove[]
): string {
  const match = [...moves]
    .sort((a, b) => b.oldPath.length - a.oldPath.length)
    .find(({ oldPath }) => {
      const rel = path.relative(oldPath, absolutePath);
      return (
        rel === "" ||
        (rel !== ".." &&
          !rel.startsWith(`..${path.sep}`) &&
          !path.isAbsolute(rel))
      );
    });

  if (!match) {
    return absolutePath;
  }

  return path.join(match.newPath, path.relative(match.oldPath, absolutePath));
}

function toPosixRelative(fromDir: string, targetAbs: string): string {
  const rel = path.relative(fromDir, targetAbs).split(path.sep).join("/");
  return rel.startsWith(".") ? rel : `./${rel}`;
}

/**
 * Rewrite local `source: file` references inside a flow after VS Code
 * rename/move events. Also rebases relative paths when the flow itself moves.
 * Returns true when any reference was changed.
 */
export function updateFileReferences(
  flow: FlydeFlow,
  flowPath: string,
  moves: readonly FileMove[]
): boolean {
  const newFlowPath = applyMove(flowPath, moves);
  const oldDir = path.dirname(flowPath);
  const newDir = path.dirname(newFlowPath);
  let changed = false;

  const rewriteRef = (ref: string): string | undefined => {
    const targetAbs = path.join(oldDir, ref);
    const newTargetAbs = applyMove(targetAbs, moves);
    const nextRef = toPosixRelative(newDir, newTargetAbs);
    // Compare resolved locations rather than string form so equivalent
    // relative spellings ("./x" vs "x") do not churn unnecessarily.
    if (path.join(newDir, ref) === newTargetAbs) {
      return undefined;
    }
    return nextRef;
  };

  const visit = (node: VisualNode) => {
    for (const instance of node.instances) {
      const source = instance.source as
        | { type: string; data?: unknown }
        | undefined;
      if (!source) {
        continue;
      }

      if (source.type === "inline" && source.data) {
        visit(source.data as VisualNode);
        continue;
      }

      if (source.type === "file" && typeof source.data === "string") {
        const next = rewriteRef(source.data);
        if (next !== undefined) {
          source.data = next;
          changed = true;
        }
      }
    }
  };

  visit(flow.node);

  // Defensive: keep deprecated top-level imports map consistent if present.
  if (flow.imports) {
    const nextImports: Record<string, string[]> = {};
    let importsChanged = false;
    for (const [ref, names] of Object.entries(flow.imports)) {
      const rewritten = rewriteRef(ref);
      if (rewritten !== undefined) {
        nextImports[rewritten] = names;
        importsChanged = true;
      } else {
        nextImports[ref] = names;
      }
    }
    if (importsChanged) {
      flow.imports = nextImports;
      changed = true;
    }
  }

  return changed;
}
