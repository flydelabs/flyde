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
          let rel = path.relative(flydeDir, rename.newUri.fsPath).replace(/\\/g, "/");
          instance.source.data = rel;
          changed = true;
        } else if (currentTarget === rename.newUri.fsPath && flydeFilePath === rename.newUri.fsPath) {
          const oldDir = path.dirname(rename.oldUri.fsPath);
          const absTarget = path.resolve(oldDir, instance.source.data);
          instance.source.data = path.relative(flydeDir, absTarget).replace(/\\/g, "/");
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
            changed = updateInstancesRecursive(parsed.node.instances, fileUri.fsPath, event.files);
          }
          if (parsed?.imports && typeof parsed.imports === "object") {
            const flydeDir = path.dirname(fileUri.fsPath);
            const updatedImports: Record<string, any> = {};
            for (const [impPath, val] of Object.entries(parsed.imports)) {
              const absImp = path.resolve(flydeDir, impPath);
              const match = event.files.find((r) => r.oldUri.fsPath === absImp);
              if (match) {
                const newRel = path.relative(flydeDir, match.newUri.fsPath).replace(/\\/g, "/");
                updatedImports[newRel] = val;
                changed = true;
              } else {
                updatedImports[impPath] = val;
              }
            }
            if (changed) parsed.imports = updatedImports;
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
