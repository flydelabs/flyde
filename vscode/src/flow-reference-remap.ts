import * as path from "path";
import type { FlydeFlow } from "@flyde/core";

export interface FileRename {
  oldPath: string;
  newPath: string;
}

/**
 * Computes where an absolute path lived before the given renames were
 * applied. Returns the path unchanged when it was not affected.
 */
export function pathBeforeRename(
  pathAfter: string,
  renames: readonly FileRename[]
): string {
  for (const rename of renames) {
    if (pathAfter === rename.newPath) {
      return rename.oldPath;
    }
    // the path lived inside a renamed folder
    if (pathAfter.startsWith(rename.newPath + path.sep)) {
      return path.join(
        rename.oldPath,
        path.relative(rename.newPath, pathAfter)
      );
    }
  }
  return pathAfter;
}

/**
 * Rewrites a relative file reference (as stored in a flow's instance
 * `source.data` or in the legacy `imports` map) so it keeps pointing at
 * the same file after renames were applied and/or after the flow file
 * itself moved from `flowDirBefore` to `flowDirAfter`.
 *
 * References that are unaffected keep their exact original string, and
 * the author's style is preserved: "./x" stays "./x", a bare "x" stays
 * bare, and "../x" references are emitted as-is.
 */
export function remapRelativeReference(
  reference: string,
  flowDirBefore: string,
  flowDirAfter: string,
  renames: readonly FileRename[]
): string {
  if (path.isAbsolute(reference)) {
    return reference;
  }

  const absoluteBefore = path.resolve(flowDirBefore, reference);

  let absoluteAfter = absoluteBefore;
  for (const rename of renames) {
    if (absoluteBefore === rename.oldPath) {
      absoluteAfter = rename.newPath;
      break;
    }
    // the referenced file lived inside a renamed folder
    if (absoluteBefore.startsWith(rename.oldPath + path.sep)) {
      absoluteAfter = path.join(
        rename.newPath,
        path.relative(rename.oldPath, absoluteBefore)
      );
      break;
    }
  }

  const relative = path
    .relative(flowDirAfter, absoluteAfter)
    .split(path.sep)
    .join("/");

  if (relative.startsWith("..")) {
    return relative;
  }
  return reference.startsWith("./") ? `./${relative}` : relative;
}

/**
 * Returns a copy of the flow with every file reference (instance
 * `source` entries of type "file", including ones nested inside inline
 * visual nodes, and the legacy top-level `imports` map) updated for the
 * given renames. `changed` reports whether any reference was rewritten.
 */
export function remapFlowReferences(
  flow: FlydeFlow,
  flowPathBefore: string,
  flowPathAfter: string,
  renames: readonly FileRename[]
): { flow: FlydeFlow; changed: boolean } {
  const flowDirBefore = path.dirname(flowPathBefore);
  const flowDirAfter = path.dirname(flowPathAfter);

  let changed = false;
  const remap = (reference: string): string => {
    const next = remapRelativeReference(
      reference,
      flowDirBefore,
      flowDirAfter,
      renames
    );
    if (next !== reference) {
      changed = true;
    }
    return next;
  };

  const nextFlow: FlydeFlow = JSON.parse(JSON.stringify(flow));

  if (nextFlow.imports) {
    const nextImports: Record<string, string[]> = {};
    for (const [specifier, nodeIds] of Object.entries(nextFlow.imports)) {
      nextImports[remap(specifier)] = nodeIds;
    }
    nextFlow.imports = nextImports;
  }

  const visit = (value: unknown): void => {
    if (Array.isArray(value)) {
      value.forEach(visit);
      return;
    }
    if (!value || typeof value !== "object") {
      return;
    }
    const obj = value as Record<string, unknown>;
    const source = obj.source as
      | { type?: unknown; data?: unknown }
      | undefined;
    if (source && source.type === "file" && typeof source.data === "string") {
      source.data = remap(source.data);
    }
    Object.values(obj).forEach(visit);
  };
  visit(nextFlow.node);

  return { flow: nextFlow, changed };
}
