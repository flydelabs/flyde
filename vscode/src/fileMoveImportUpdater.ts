import * as path from "path";

export interface RenamedFileEntry {
  oldPath: string;
  newPath: string;
}

export interface FlowLikeNode {
  instances?: Array<{
    source?: {
      type?: string;
      data?: any;
    };
    [key: string]: any;
  }>;
  [key: string]: any;
}

export interface FlowDocumentLike {
  imports?: Record<string, string | string[]>;
  node?: FlowLikeNode;
  [key: string]: any;
}

function normalizePathForCompare(p: string): string {
  const resolved = path.resolve(p);
  return process.platform === "win32" ? resolved.toLowerCase() : resolved;
}

/**
 * Given an absolute path prior to a file/directory rename operation,
 * returns its new absolute path if it was directly renamed or inside a renamed directory.
 */
export function resolveMovedTargetPath(
  absTargetPath: string,
  renamedEntries: ReadonlyArray<RenamedFileEntry>
): string {
  const resolvedTarget = path.resolve(absTargetPath);
  const normTarget = normalizePathForCompare(resolvedTarget);

  for (const entry of renamedEntries) {
    const resolvedOld = path.resolve(entry.oldPath);
    const resolvedNew = path.resolve(entry.newPath);
    const normOld = normalizePathForCompare(resolvedOld);

    if (normTarget === normOld) {
      return resolvedNew;
    }

    const oldPrefix = normOld.endsWith(path.sep)
      ? normOld
      : normOld + path.sep;
    if (normTarget.startsWith(oldPrefix)) {
      const suffix = resolvedTarget.slice(resolvedOld.length);
      return path.join(resolvedNew, suffix);
    }
  }

  return resolvedTarget;
}

/**
 * Formats a POSIX-normalized relative path from `fromFlowDir` to `toTargetAbsPath`,
 * preserving the original `./` prefix convention when located in the same or child folder.
 */
export function formatRelativeFlydeImport(
  fromFlowDir: string,
  toTargetAbsPath: string,
  originalSpecifier: string
): string {
  const rawRelative = path
    .relative(path.resolve(fromFlowDir), path.resolve(toTargetAbsPath))
    .split(path.sep)
    .join("/");

  if (!rawRelative.startsWith(".")) {
    if (originalSpecifier.startsWith("./")) {
      return `./${rawRelative}`;
    }
    return rawRelative;
  }

  return rawRelative;
}

function isRelativeImportKey(specifier: string): boolean {
  if (!specifier || specifier.startsWith("@")) {
    return false;
  }
  return (
    specifier.startsWith(".") ||
    specifier.endsWith(".flyde") ||
    specifier.endsWith(".flyde.ts") ||
    specifier.endsWith(".flyde.js")
  );
}

/**
 * Updates `source: { type: "file", data: "..." }` references recursively across a VisualNode
 * and its inline sub-nodes when either the flow file or imported files/folders move.
 */
export function updateVisualNodeFileSources(
  node: FlowLikeNode | undefined,
  oldFlowDir: string,
  newFlowDir: string,
  renamedEntries: ReadonlyArray<RenamedFileEntry>
): boolean {
  if (!node || !Array.isArray(node.instances)) {
    return false;
  }

  let changed = false;

  for (const instance of node.instances) {
    const source = instance?.source;
    if (!source) {
      continue;
    }

    if (source.type === "file" && typeof source.data === "string") {
      const oldAbsTarget = path.resolve(oldFlowDir, source.data);
      const newAbsTarget = resolveMovedTargetPath(oldAbsTarget, renamedEntries);
      const updatedSpecifier = formatRelativeFlydeImport(
        newFlowDir,
        newAbsTarget,
        source.data
      );

      if (updatedSpecifier !== source.data) {
        source.data = updatedSpecifier;
        changed = true;
      }
    } else if (source.type === "inline" && source.data && typeof source.data === "object") {
      if (
        updateVisualNodeFileSources(
          source.data as FlowLikeNode,
          oldFlowDir,
          newFlowDir,
          renamedEntries
        )
      ) {
        changed = true;
      }
    }
  }

  return changed;
}

/**
 * Updates both modern `node.instances[].source` (`type: "file"`) and legacy top-level `imports`
 * on a parsed Flyde flow object when files or folders are moved.
 */
export function updateFlowObjectImportsOnMove(
  flow: FlowDocumentLike,
  oldFlowPath: string,
  newFlowPath: string,
  renamedEntries: ReadonlyArray<RenamedFileEntry>
): boolean {
  const oldFlowDir = path.dirname(path.resolve(oldFlowPath));
  const newFlowDir = path.dirname(path.resolve(newFlowPath));

  let changed = updateVisualNodeFileSources(
    flow.node,
    oldFlowDir,
    newFlowDir,
    renamedEntries
  );

  if (flow.imports && typeof flow.imports === "object") {
    const updatedImports: Record<string, string | string[]> = {};
    let importsChanged = false;

    for (const [importKey, importedValue] of Object.entries(flow.imports)) {
      if (isRelativeImportKey(importKey)) {
        const oldAbsTarget = path.resolve(oldFlowDir, importKey);
        const newAbsTarget = resolveMovedTargetPath(
          oldAbsTarget,
          renamedEntries
        );
        const nextKey = formatRelativeFlydeImport(
          newFlowDir,
          newAbsTarget,
          importKey
        );
        if (nextKey !== importKey) {
          importsChanged = true;
        }
        updatedImports[nextKey] = importedValue;
      } else {
        updatedImports[importKey] = importedValue;
      }
    }

    if (importsChanged) {
      flow.imports = updatedImports;
      changed = true;
    }
  }

  return changed;
}
