import * as path from "path";
import * as yaml from "yaml";

export type FileRename = {
  oldPath: string;
  newPath: string;
};

type ImportUpdateResult = {
  changed: boolean;
  contents: string;
};

export function updateFlydeImportsForRenamedFiles(
  flowContents: string,
  currentFlowPath: string,
  renames: FileRename[]
): ImportUpdateResult {
  const flow = yaml.parse(flowContents);
  const imports = (flow?.imports ?? {}) as Record<string, unknown>;
  const oldFlowPath = findOldFlowPath(currentFlowPath, renames);
  const updatedImports: Record<string, string | string[]> = {};
  let changed = false;

  for (const [importPath, nodeIds] of Object.entries(imports)) {
    if (!isLocalImport(importPath)) {
      updatedImports[importPath] = toImportedNodeIds(nodeIds);
      continue;
    }

    const previousImportTarget = path.resolve(
      path.dirname(oldFlowPath),
      importPath
    );
    const nextImportTarget =
      mapRenamedPath(previousImportTarget, renames) ?? previousImportTarget;
    const nextImportPath = toFlydeRelativeImportPath(
      currentFlowPath,
      nextImportTarget
    );

    if (normalizeImportPath(importPath) !== nextImportPath) {
      changed = true;
    }

    const importedNodeIds = toImportedNodeIds(nodeIds);
    const existing = updatedImports[nextImportPath] ?? [];
    const existingNodeIds = Array.isArray(existing) ? existing : [existing];
    updatedImports[nextImportPath] = Array.from(
      new Set([...existingNodeIds, ...importedNodeIds])
    );
  }

  if (!changed) {
    return { changed: false, contents: flowContents };
  }

  flow.imports = updatedImports;

  return {
    changed: true,
    contents: yaml.stringify(flow, { aliasDuplicateObjects: false }),
  };
}

function findOldFlowPath(currentFlowPath: string, renames: FileRename[]) {
  const matchedRename = renames.find((rename) =>
    samePath(rename.newPath, currentFlowPath)
  );

  return matchedRename?.oldPath ?? currentFlowPath;
}

function mapRenamedPath(targetPath: string, renames: FileRename[]) {
  const normalizedTarget = comparablePath(targetPath);

  for (const rename of renames) {
    const normalizedOldPath = comparablePath(rename.oldPath);

    if (normalizedTarget === normalizedOldPath) {
      return rename.newPath;
    }
  }
}

function toFlydeRelativeImportPath(fromFlowPath: string, targetPath: string) {
  let relativePath = path
    .relative(path.dirname(fromFlowPath), targetPath)
    .split(path.sep)
    .join("/");

  if (!relativePath.startsWith(".")) {
    relativePath = `./${relativePath}`;
  }

  return relativePath;
}

function isLocalImport(importPath: string) {
  return importPath.startsWith(".") || path.isAbsolute(importPath);
}

function toImportedNodeIds(value: unknown) {
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === "string");
  }

  return typeof value === "string" ? [value] : [];
}

function normalizeImportPath(importPath: string) {
  return importPath.split(path.sep).join("/");
}

function samePath(a: string, b: string) {
  return comparablePath(a) === comparablePath(b);
}

function comparablePath(filePath: string) {
  const normalized = path.normalize(path.resolve(filePath));
  return process.platform === "win32" ? normalized.toLowerCase() : normalized;
}
