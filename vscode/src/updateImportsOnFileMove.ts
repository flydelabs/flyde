import * as path from "path";
import * as yaml from "yaml";

export interface RenameItem {
  oldPath: string;
  newPath: string;
}

/**
 * Normalizes a relative path to posix format with leading ./ or ../
 */
export function normalizeRelativePath(fromDir: string, toTarget: string): string {
  let rel = path.relative(fromDir, toTarget).split(path.sep).join("/");
  if (!rel.startsWith(".")) {
    rel = `./${rel}`;
  }
  return rel;
}

/**
 * Checks if a path is a relative import (starts with . or ..)
 */
export function isRelativeImport(importPath: string): boolean {
  return /^\.{1,2}([\\/]|$)/.test(importPath);
}

/**
 * Calculates the new target file path given an import and a list of file/folder renames.
 * Returns null if the import target was not affected by any renames.
 */
export function resolveTargetAfterRenames(
  fromDir: string,
  importPath: string,
  renames: RenameItem[]
): string | null {
  if (!isRelativeImport(importPath)) {
    return null; // External package or non-relative import
  }

  const absTarget = path.resolve(fromDir, importPath);

  for (const rename of renames) {
    const oldP = path.resolve(rename.oldPath);
    const newP = path.resolve(rename.newPath);

    // Exact file match
    if (absTarget === oldP) {
      return newP;
    }

    // Directory match: imported file is inside a moved folder
    const oldPrefix = oldP.endsWith(path.sep) ? oldP : oldP + path.sep;
    if (absTarget.startsWith(oldPrefix)) {
      const relSuffix = path.relative(oldP, absTarget);
      return path.join(newP, relSuffix);
    }
  }

  return absTarget;
}

/**
 * Recursively updates instances in a Flyde flow AST.
 */
export function updateInstancesRecursive(
  instances: any[],
  currentFlydePath: string,
  oldFlydePath: string,
  renames: RenameItem[]
): boolean {
  if (!Array.isArray(instances)) {
    return false;
  }

  let changed = false;
  const currentFlydeDir = path.dirname(currentFlydePath);
  const oldFlydeDir = path.dirname(oldFlydePath);
  const fileItselfMoved = currentFlydePath !== oldFlydePath;

  for (const instance of instances) {
    if (!instance || typeof instance !== "object") continue;

    // Check file source
    if (instance.source?.type === "file" && typeof instance.source.data === "string") {
      const originalPath = instance.source.data;
      if (isRelativeImport(originalPath)) {
        const resolvedTarget = resolveTargetAfterRenames(oldFlydeDir, originalPath, renames);
        if (resolvedTarget) {
          const newRel = normalizeRelativePath(currentFlydeDir, resolvedTarget);
          if (newRel !== originalPath) {
            instance.source.data = newRel;
            changed = true;
          }
        }
      }
    }

    // Recurse into inline flow instances
    if (instance.source?.type === "inline" && Array.isArray(instance.source.data?.instances)) {
      if (updateInstancesRecursive(instance.source.data.instances, currentFlydePath, oldFlydePath, renames)) {
        changed = true;
      }
    }
  }

  return changed;
}

/**
 * Updates imports and instances in a .flyde YAML string after files/folders are moved.
 */
export function updateFlydeContent(
  rawYaml: string,
  currentFlydePath: string,
  oldFlydePath: string,
  renames: RenameItem[]
): { changed: boolean; content: string } {
  let parsed: any;
  try {
    parsed = yaml.parse(rawYaml);
  } catch {
    return { changed: false, content: rawYaml };
  }

  if (!parsed || typeof parsed !== "object") {
    return { changed: false, content: rawYaml };
  }

  let changed = false;
  const currentFlydeDir = path.dirname(currentFlydePath);
  const oldFlydeDir = path.dirname(oldFlydePath);
  const fileItselfMoved = currentFlydePath !== oldFlydePath;

  // 1. Update top-level imports map
  if (parsed.imports && typeof parsed.imports === "object" && !Array.isArray(parsed.imports)) {
    const updatedImports: Record<string, any> = {};
    for (const [impPath, val] of Object.entries(parsed.imports)) {
      if (!isRelativeImport(impPath)) {
        updatedImports[impPath] = val;
        continue;
      }

      const resolvedTarget = resolveTargetAfterRenames(oldFlydeDir, impPath, renames);
      if (resolvedTarget) {
        const newRel = normalizeRelativePath(currentFlydeDir, resolvedTarget);
        if (newRel !== impPath) {
          changed = true;
        }
        updatedImports[newRel] = val;
      } else {
        updatedImports[impPath] = val;
      }
    }

    if (changed) {
      parsed.imports = updatedImports;
    }
  }

  // 2. Update instances
  if (Array.isArray(parsed.node?.instances)) {
    if (updateInstancesRecursive(parsed.node.instances, currentFlydePath, oldFlydePath, renames)) {
      changed = true;
    }
  }

  if (changed) {
    return {
      changed: true,
      content: yaml.stringify(parsed, { aliasDuplicateObjects: false }),
    };
  }

  return { changed: false, content: rawYaml };
}

/**
 * VS Code extension listener for workspace.onDidRenameFiles
 */
export function registerImportUpdater(context: any, vscodeModule?: any): void {
  const vscode = vscodeModule || (typeof require !== "undefined" ? require("vscode") : null);
  if (!vscode?.workspace?.onDidRenameFiles) {
    return;
  }

  context.subscriptions.push(
    vscode.workspace.onDidRenameFiles(async (event: any) => {
      const flydeFiles = await vscode.workspace.findFiles("**/*.flyde", "**/node_modules/**");
      const renames: RenameItem[] = event.files.map((f: any) => ({
        oldPath: f.oldUri.fsPath,
        newPath: f.newUri.fsPath,
      }));

      for (const flydeUri of flydeFiles) {
        try {
          const matchMovedSelf = renames.find((r) => r.oldPath === flydeUri.fsPath);
          const currentFlydePath = matchMovedSelf ? matchMovedSelf.newPath : flydeUri.fsPath;
          const oldFlydePath = flydeUri.fsPath;

          const docBytes = await vscode.workspace.fs.readFile(
            vscode.Uri.file(currentFlydePath)
          );
          const rawContent = Buffer.from(docBytes).toString("utf8");

          const { changed, content } = updateFlydeContent(
            rawContent,
            currentFlydePath,
            oldFlydePath,
            renames
          );

          if (changed) {
            await vscode.workspace.fs.writeFile(
              vscode.Uri.file(currentFlydePath),
              Buffer.from(content, "utf8")
            );
          }
        } catch (e) {
          console.warn(`[Flyde] Could not update imports for ${flydeUri.fsPath}:`, e);
        }
      }
    })
  );
}
