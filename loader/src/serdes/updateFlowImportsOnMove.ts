import * as path from "path";
import * as yaml from "yaml";
import { deserializeFlow } from "./deserialize";
import { serializeFlow } from "./serialize";

export interface MovedFileEntry {
  oldPath: string;
  newPath: string;
}

function toPosixRelative(fromDir: string, toFile: string): string {
  const rel = path.relative(fromDir, toFile).split(path.sep).join("/");
  if (!rel.startsWith(".")) {
    return "./" + rel;
  }
  return rel;
}

function isRelativeImport(importSpec: string): boolean {
  return importSpec.startsWith("./") || importSpec.startsWith("../");
}

function resolveMovedTarget(
  resolvedOriginalTarget: string,
  movedFiles: MovedFileEntry[]
): string {
  const normalizedTarget = path.resolve(resolvedOriginalTarget);
  for (const entry of movedFiles) {
    const oldAbs = path.resolve(entry.oldPath);
    const newAbs = path.resolve(entry.newPath);
    if (normalizedTarget === oldAbs) {
      return newAbs;
    }
    const oldPrefix = oldAbs.endsWith(path.sep) ? oldAbs : oldAbs + path.sep;
    if (normalizedTarget.startsWith(oldPrefix)) {
      const suffix = normalizedTarget.slice(oldPrefix.length);
      return path.join(newAbs, suffix);
    }
  }
  return normalizedTarget;
}

/**
 * Rewrites a single relative import path when either the `.flyde` flow file itself
 * or the imported target file/folder has moved to a new location (#112).
 */
export function rewriteRelativeImportPath(
  flowOldPath: string,
  flowNewPath: string,
  rawImportPath: string,
  movedFiles: MovedFileEntry[]
): string {
  if (!isRelativeImport(rawImportPath)) {
    return rawImportPath;
  }
  const oldFlowDir = path.dirname(path.resolve(flowOldPath));
  const newFlowDir = path.dirname(path.resolve(flowNewPath));

  const originalTargetAbs = path.resolve(oldFlowDir, rawImportPath);
  const finalTargetAbs = resolveMovedTarget(originalTargetAbs, movedFiles);

  if (oldFlowDir === newFlowDir && originalTargetAbs === finalTargetAbs) {
    return rawImportPath;
  }
  return toPosixRelative(newFlowDir, finalTargetAbs);
}

/**
 * Updates both legacy `imports` map and `node.instances[].source` file references
 * inside a `.flyde` flow YAML document when files or directories are moved (#112).
 */
export function updateFlowImportsOnMove(
  flowContents: string,
  flowOldPath: string,
  flowNewPath: string,
  movedFiles: MovedFileEntry[]
): { content: string; updated: boolean } {
  const parsedRaw = yaml.parse(flowContents) || {};
  const flow = deserializeFlow(flowContents, flowOldPath);
  let updated = false;

  if (flow.imports && Object.keys(flow.imports).length > 0) {
    const nextImports: Record<string, string[]> = {};
    for (const [impPath, val] of Object.entries(flow.imports)) {
      const rewritten = rewriteRelativeImportPath(
        flowOldPath,
        flowNewPath,
        impPath,
        movedFiles
      );
      if (rewritten !== impPath) {
        updated = true;
      }
      nextImports[rewritten] = val;
    }
    flow.imports = nextImports;
  }

  if (flow.node && Array.isArray(flow.node.instances)) {
    for (const inst of flow.node.instances) {
      if (
        inst.source &&
        (inst.source.type === "file" || inst.source.type === "package") &&
        typeof inst.source.data === "string" &&
        isRelativeImport(inst.source.data)
      ) {
        const rewritten = rewriteRelativeImportPath(
          flowOldPath,
          flowNewPath,
          inst.source.data,
          movedFiles
        );
        if (rewritten !== inst.source.data) {
          inst.source = {
            ...inst.source,
            data: rewritten,
          };
          updated = true;
        }
      }
    }
  }

  if (!updated) {
    return { content: flowContents, updated: false };
  }

  const serialized = serializeFlow(flow);
  if (!parsedRaw.imports && flow.imports && Object.keys(flow.imports).length === 0) {
    const doc = yaml.parse(serialized);
    delete doc.imports;
    return {
      content: yaml.stringify(doc, { aliasDuplicateObjects: false }),
      updated: true,
    };
  }
  return { content: serialized, updated: true };
}
