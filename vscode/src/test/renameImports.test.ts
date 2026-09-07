import * as assert from "assert";
import * as vscode from "vscode";
import * as path from "path";
import { tmpdir } from "os";
import { mkdtempSync, rmSync } from "fs";
import { registerImportRenames } from "../renameImports";

suite("Flyde file rename integration", () => {
  test("renames a target and updates a dirty open flow without losing edits", async () => {
    const directory = mkdtempSync(path.join(tmpdir(), "flyde-import-rename-"));
    const parent = vscode.Uri.file(path.join(directory, "Parent.flyde"));
    const child = vscode.Uri.file(path.join(directory, "Child.flyde"));
    const renamed = vscode.Uri.file(path.join(directory, "Renamed.flyde"));
    const output = vscode.window.createOutputChannel("Flyde rename test");
    const registration = registerImportRenames(output);
    try {
      const content =
        "# unsaved comment\nnode:\n  instances:\n    - source: {type: file, data: ./Child.flyde}\n";
      await vscode.workspace.fs.writeFile(parent, Buffer.from("node: {}\n"));
      await vscode.workspace.fs.writeFile(child, Buffer.from("node: {}\n"));
      const document = await vscode.workspace.openTextDocument(parent);
      const dirtyEdit = new vscode.WorkspaceEdit();
      dirtyEdit.replace(
        parent,
        new vscode.Range(
          document.positionAt(0),
          document.positionAt(document.getText().length),
        ),
        content,
      );
      assert.ok(await vscode.workspace.applyEdit(dirtyEdit));
      assert.ok(document.isDirty);

      const rename = new vscode.WorkspaceEdit();
      rename.renameFile(child, renamed);
      assert.ok(await vscode.workspace.applyEdit(rename));
      assert.strictEqual(
        document.getText(),
        content.replace("./Child.flyde", '"./Renamed.flyde"'),
      );
      assert.ok(document.isDirty);
      await document.save();
    } finally {
      registration.dispose();
      output.dispose();
      rmSync(directory, { recursive: true, force: true });
    }
  });
});
