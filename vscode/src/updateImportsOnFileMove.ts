import * as vscode from "vscode";
import * as path from "path";
import * as fs from "fs";
import * as yaml from "yaml";

/**
 * When a .flyde or .flyde.ts file is moved/renamed, update all .flyde files
 * that reference it via source.type === "file" so their relative paths stay valid.
 */
export function registerImportUpdater(
  context: vscode.ExtensionContext
): void {
  context.subscriptions.push(
    vscode.workspace.onDidRenameFiles(async (event) => {
      const relevantRenames = event.files.filter((f) => {
        const oldPath = f.oldUri.fsPath;
        return oldPath.endsWith(".flyde") || oldPath.endsWith(".flyde.ts");
      });

      if (relevantRenames.length === 0) {
        return;
      }

      const flydeFiles = await vscode.workspace.findFiles(
        "**/*.flyde",
        "**/node_modules/**"
      );

      let totalUpdated = 0;

      for (const flydeFileUri of flydeFiles) {
        const flydeFilePath = flydeFileUri.fsPath;

        // Skip files that were themselves moved (they don't need internal updates)
        if (
          relevantRenames.some(
            (r) =>
              r.oldUri.fsPath === flydeFilePath ||
              r.newUri.fsPath === flydeFilePath
          )
        ) {
          continue;
        }

        let raw: string;
        try {
          raw = fs.readFileSync(flydeFilePath, "utf-8");
        } catch {
          continue;
        }

        let parsed: any;
        try {
          parsed = yaml.parse(raw);
        } catch {
          continue;
        }

        if (!parsed?.node?.instances) {
          continue;
        }

        let changed = false;

        for (const instance of parsed.node.instances) {
          if (
            instance.source?.type === "file" &&
            typeof instance.source.data === "string"
          ) {
            const oldAbsolute = path.resolve(
              path.dirname(flydeFilePath),
              instance.source.data
            );

            for (const rename of relevantRenames) {
              if (normalizePath(oldAbsolute) === normalizePath(rename.oldUri.fsPath)) {
                const newRelative = toRelativePosix(
                  flydeFilePath,
                  rename.newUri.fsPath
                );
                instance.source.data = newRelative;
                changed = true;
              }
            }
          }

          // Also check inline visual nodes recursively
          if (instance.source?.type === "inline" && instance.source.data?.instances) {
            if (updateInstancesRecursive(instance.source.data.instances, flydeFilePath, relevantRenames)) {
              changed = true;
            }
          }
        }

        if (changed) {
          const updated = yaml.stringify(parsed, {
            aliasDuplicateObjects: false,
          });
          fs.writeFileSync(flydeFilePath, updated, "utf-8");
          totalUpdated++;
        }
      }

      // Also update .flyde files that were themselves moved — their internal
      // relative references to OTHER files need recalculating.
      for (const rename of relevantRenames) {
        if (!rename.newUri.fsPath.endsWith(".flyde")) {
          continue;
        }

        const flydeFilePath = rename.newUri.fsPath;
        const oldDir = path.dirname(rename.oldUri.fsPath);
        const newDir = path.dirname(rename.newUri.fsPath);

        // If it only changed name but not directory, internal relative paths are still valid
        if (normalizePath(oldDir) === normalizePath(newDir)) {
          continue;
        }

        let raw: string;
        try {
          raw = fs.readFileSync(flydeFilePath, "utf-8");
        } catch {
          continue;
        }

        let parsed: any;
        try {
          parsed = yaml.parse(raw);
        } catch {
          continue;
        }

        if (!parsed?.node?.instances) {
          continue;
        }

        let changed = false;

        for (const instance of parsed.node.instances) {
          if (
            instance.source?.type === "file" &&
            typeof instance.source.data === "string"
          ) {
            // Resolve relative to OLD location
            const targetAbsolute = path.resolve(
              oldDir,
              instance.source.data
            );

            // Check if target still exists at old path (wasn't also moved)
            const wasAlsoMoved = relevantRenames.find(
              (r) => normalizePath(r.oldUri.fsPath) === normalizePath(targetAbsolute)
            );

            const actualTarget = wasAlsoMoved
              ? wasAlsoMoved.newUri.fsPath
              : targetAbsolute;

            const newRelative = toRelativePosix(flydeFilePath, actualTarget);
            if (newRelative !== instance.source.data) {
              instance.source.data = newRelative;
              changed = true;
            }
          }
        }

        if (changed) {
          const updated = yaml.stringify(parsed, {
            aliasDuplicateObjects: false,
          });
          fs.writeFileSync(flydeFilePath, updated, "utf-8");
          totalUpdated++;
        }
      }

      if (totalUpdated > 0) {
        vscode.window.showInformationMessage(
          `Flyde: Updated import paths in ${totalUpdated} flow file${totalUpdated > 1 ? "s" : ""}.`
        );
      }
    })
  );
}

function updateInstancesRecursive(
  instances: any[],
  flydeFilePath: string,
  renames: ReadonlyArray<{ oldUri: vscode.Uri; newUri: vscode.Uri }>
): boolean {
  let changed = false;
  for (const instance of instances) {
    if (
      instance.source?.type === "file" &&
      typeof instance.source.data === "string"
    ) {
      const oldAbsolute = path.resolve(
        path.dirname(flydeFilePath),
        instance.source.data
      );
      for (const rename of renames) {
        if (normalizePath(oldAbsolute) === normalizePath(rename.oldUri.fsPath)) {
          instance.source.data = toRelativePosix(flydeFilePath, rename.newUri.fsPath);
          changed = true;
        }
      }
    }
    if (instance.source?.type === "inline" && instance.source.data?.instances) {
      if (updateInstancesRecursive(instance.source.data.instances, flydeFilePath, renames)) {
        changed = true;
      }
    }
  }
  return changed;
}

function toRelativePosix(from: string, to: string): string {
  let rel = path.relative(path.dirname(from), to).replace(/\\/g, "/");
  if (!rel.startsWith(".")) {
    rel = "./" + rel;
  }
  return rel;
}

function normalizePath(p: string): string {
  return path.resolve(p).replace(/\\/g, "/").toLowerCase();
}
