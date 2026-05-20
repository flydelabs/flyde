import * as path from "path";
import { deserializeFlow, serializeFlow } from "@flyde/loader";

interface RewriteResult {
  changed: boolean;
  content: string;
}

function normalizeFilePath(filePath: string): string {
  return path.resolve(filePath);
}

function toFlydeRelativePath(fromDir: string, toFile: string, previousValue: string): string {
  const relativePath = path.relative(fromDir, toFile).split(path.sep).join("/");

  if (relativePath.startsWith(".")) {
    return relativePath;
  }

  return previousValue.startsWith("./") ? `./${relativePath}` : relativePath;
}

function rewriteMatchingFileSources(
  content: string,
  flowPath: string,
  resolveFromPath: string,
  replacementFromPath: string,
  replacementToPath: string
): RewriteResult {
  const flow = deserializeFlow(content, flowPath);
  const instances = flow.node.instances ?? [];
  let changed = false;

  for (const instance of instances) {
    const source = instance.source;

    if (source?.type !== "file" || typeof source.data !== "string") {
      continue;
    }

    const currentTarget = normalizeFilePath(path.resolve(resolveFromPath, source.data));

    if (currentTarget !== normalizeFilePath(replacementFromPath)) {
      continue;
    }

    source.data = toFlydeRelativePath(
      path.dirname(flowPath),
      replacementToPath,
      source.data
    );
    changed = true;
  }

  return {
    changed,
    content: changed ? serializeFlow(flow) : content,
  };
}

export function rewriteMovedFlowImports(
  content: string,
  oldFlowPath: string,
  newFlowPath: string
): RewriteResult {
  const flow = deserializeFlow(content, newFlowPath);
  const instances = flow.node.instances ?? [];
  let changed = false;

  for (const instance of instances) {
    const source = instance.source;

    if (source?.type !== "file" || typeof source.data !== "string") {
      continue;
    }

    const previousValue = source.data;
    const target = normalizeFilePath(path.resolve(path.dirname(oldFlowPath), previousValue));
    source.data = toFlydeRelativePath(path.dirname(newFlowPath), target, previousValue);

    if (source.data !== previousValue) {
      changed = true;
    }
  }

  return {
    changed,
    content: changed ? serializeFlow(flow) : content,
  };
}

export function rewriteMovedImportTarget(
  content: string,
  flowPath: string,
  oldTargetPath: string,
  newTargetPath: string
): RewriteResult {
  return rewriteMatchingFileSources(
    content,
    flowPath,
    path.dirname(flowPath),
    oldTargetPath,
    newTargetPath
  );
}
