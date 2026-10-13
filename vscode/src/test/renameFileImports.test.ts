import * as assert from "assert";
import * as vscode from "vscode";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";
import { createFileImportRenameEdit, registerFileImportRenames } from "../renameFileImports";

suite("File import rename edits", () => {
  let directory: string;
  let cancellation: vscode.CancellationTokenSource;

  setup(() => {
    directory = mkdtempSync(join(tmpdir(), "flyde-vscode-rename-"));
    cancellation = new vscode.CancellationTokenSource();
  });

  teardown(async () => {
    cancellation.dispose();
    for (const document of vscode.workspace.textDocuments) {
      if (document.uri.fsPath.startsWith(directory) && document.isDirty) {
        await document.save();
      }
    }
    await vscode.commands.executeCommand("workbench.action.closeAllEditors");
    rmSync(directory, { recursive: true, force: true });
  });

  async function prepare(importPath = "./Node.flyde.ts") {
    const uri = vscode.Uri.file(join(directory, "Main.flyde"));
    writeFileSync(uri.fsPath, `node:\n  instances:\n    - source: { type: file, data: '${importPath}' } # keep\n`);
    return vscode.workspace.openTextDocument(uri);
  }

  function event(oldPath: string, newPath: string): vscode.FileWillRenameEvent {
    return {
      files: [{ oldUri: vscode.Uri.file(join(directory, oldPath)), newUri: vscode.Uri.file(join(directory, newPath)) }],
      token: cancellation.token,
      waitUntil() {},
    };
  }

  test("updates a dirty document without saving its buffer", async () => {
    const document = await prepare();
    const dirtyEdit = new vscode.WorkspaceEdit();
    dirtyEdit.insert(document.uri, new vscode.Position(0, 0), "# unsaved\n");
    assert.ok(await vscode.workspace.applyEdit(dirtyEdit));
    const edit = await createFileImportRenameEdit(event("Node.flyde.ts", "lib/Node.flyde.ts"));
    assert.ok(await vscode.workspace.applyEdit(edit));
    assert.ok(document.getText().startsWith("# unsaved\n"));
    assert.ok(document.getText().includes('data: "./lib/Node.flyde.ts"'));
    assert.ok(document.getText().includes("# keep"));
    assert.ok(document.isDirty);
  });

  test("rebases a moved flow using its original URI", async () => {
    const document = await prepare();
    const edit = await createFileImportRenameEdit(event("Main.flyde", "flows/Main.flyde"));
    assert.equal(edit.get(document.uri).length, 1);
    assert.ok(await vscode.workspace.applyEdit(edit));
    assert.ok(document.getText().includes('data: "../Node.flyde.ts"'));
  });

  test("keeps a code import working through a real file move", async () => {
    const document = await prepare();
    const oldUri = vscode.Uri.file(join(directory, "Node.flyde.ts"));
    const newUri = vscode.Uri.file(join(directory, "lib/Node.flyde.ts"));
    writeFileSync(oldUri.fsPath, "export const Node = {};\n");
    mkdirSync(join(directory, "lib"));
    const edit = new vscode.WorkspaceEdit();
    edit.renameFile(oldUri, newUri);
    const registration = registerFileImportRenames();
    try {
      assert.ok(await vscode.workspace.applyEdit(edit));
    } finally {
      registration.dispose();
    }
    assert.ok(document.getText().includes('data: "./lib/Node.flyde.ts"'));
    assert.equal((await vscode.workspace.fs.stat(newUri)).type, vscode.FileType.File);
  });

  test("discards edits for a cancelled rename", async () => {
    await prepare();
    cancellation.cancel();
    const edit = await createFileImportRenameEdit(event("Node.flyde.ts", "lib/Node.flyde.ts"));
    assert.equal(edit.size, 0);
  });
});
