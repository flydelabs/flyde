import * as vscode from "vscode";
import {
  deserializeFlow,
  RenamedFile,
  serializeFlow,
  updateFlowReferencesOnRename,
} from "@flyde/loader";

const decoder = new TextDecoder();
const encoder = new TextEncoder();

export async function updateFlowReferencesForRename(
  renames: RenamedFile[]
): Promise<void> {
  const flowUris = await vscode.workspace.findFiles(
    "**/*.flyde",
    "{**/node_modules/**,**/.git/**}"
  );

  await Promise.all(
    flowUris.map(async (uri) => {
      const document = vscode.workspace.textDocuments.find(
        (candidate) => candidate.uri.fsPath === uri.fsPath
      );

      let flow;
      let updatedContents: string;
      try {
        const contents = document
          ? document.getText()
          : decoder.decode(await vscode.workspace.fs.readFile(uri));
        flow = deserializeFlow(contents, uri.fsPath);
        if (!updateFlowReferencesOnRename(flow, uri.fsPath, renames)) {
          return;
        }
        updatedContents = serializeFlow(flow);
      } catch {
        return;
      }

      if (document) {
        const edit = new vscode.WorkspaceEdit();
        edit.replace(
          uri,
          document.validateRange(
            new vscode.Range(0, 0, Number.MAX_VALUE, 0)
          ),
          updatedContents
        );
        if (!(await vscode.workspace.applyEdit(edit))) {
          throw new Error(`Failed to update flow references in ${uri.fsPath}`);
        }
      } else {
        await vscode.workspace.fs.writeFile(uri, encoder.encode(updatedContents));
      }
    })
  );
}
