import * as vscode from "vscode";
import * as path from "path";
import * as fs from "fs";
import * as yaml from "yaml";

function updateInstancesRecursive(
  instances: any[],
  flydeFilePath: string,
  renames: readonly { readonly oldUri: vscode.Uri; readonly newUri: vscode.Uri }[]
): boolean {
  let changed = false;
  const flydeDir = path.dirname(flydeFilePath);

  for (const instance of instances) {
    if (instance?.source?.type === "file" && typeof instance.source.data === "string") {
      const currentTarget = path.resolve(flydeDir, instance.source.data);
      for (const rename of renames) {
        if (currentTarget === rename.oldUri.fsPath) {
          const rel = path.relative(flydeDir, rename.newUri.fsPath).replace(/\\/g, "/");
          instance.source.data = rel;
          changed = true;
        } else if (flydeFilePath === rename.newUri.fsPath) {
          // The importing .flyde file itself was moved
          const oldDir = path.dirname(rename.oldUri.fsPath);
          const absTarget = path.resolve(oldDir, instance.source.data);
          const matchedTargetRename = renames.find((r) => r.oldUri.fsPath === absTarget);
          const finalTarget = matchedTargetRename ? matchedTargetRename.newUri.fsPath : absTarget;
          instance.source.data = path.relative(flydeDir, finalTarget).replace(/\\/g, "/");
          changed = true;
        }
      }
    }
    if (instance?.source?.type === "inline" && Array.isArray(instance.source.data?.instances)) {
      if (updateInstancesRecursive(instance.source.data.instances, flydeFilePath, renames)) {
        changed = true;
      }
    }
  }
  return changed;
}

export function registerImportUpdater(context: vscode.ExtensionContext): void {
  context.subscriptions.push(
    vscode.workspace.onDidRenameFiles(async (event) => {
      const flydeFiles = await vscode.workspace.findFiles("**/*.flyde", "**/node_modules/**");
      for (const fileUri of flydeFiles) {
        try {
          const raw = fs.readFileSync(fileUri.fsPath, "utf8");
          const parsed = yaml.parse(raw);
          let changed = false;
          if (Array.isArray(parsed?.node?.instances)) {
            if (updateInstancesRecursive(parsed.node.instances, fileUri.fsPath, event.files)) {
              changed = true;
            }
          }
          if (parsed?.imports && typeof parsed.imports === "object") {
            const flydeDir = path.dirname(fileUri.fsPath);
            const selfMove = event.files.find((r) => r.newUri.fsPath === fileUri.fsPath);
            const baseResolveDir = selfMove ? path.dirname(selfMove.oldUri.fsPath) : flydeDir;
            const updatedImports: Record<string, any> = {};
            let importsChanged = false;
            for (const [impPath, val] of Object.entries(parsed.imports)) {
              const absImp = path.resolve(baseResolveDir, impPath);
              const match = event.files.find((r) => r.oldUri.fsPath === absImp);
              if (match) {
                const newRel = path.relative(flydeDir, match.newUri.fsPath).replace(/\\/g, "/");
                updatedImports[newRel] = val;
                importsChanged = true;
              } else if (selfMove && (impPath.startsWith(".") || impPath.startsWith("/"))) {
                const newRel = path.relative(flydeDir, absImp).replace(/\\/g, "/");
                updatedImports[newRel] = val;
                importsChanged = true;
              } else {
                updatedImports[impPath] = val;
              }
            }
            if (importsChanged) {
              parsed.imports = updatedImports;
              changed = true;
            }
          }
          if (changed) {
            fs.writeFileSync(fileUri.fsPath, yaml.stringify(parsed), "utf8");
          }
        } catch {
          // ignore malformed .flyde files
        }
      }
    })
  );
}
