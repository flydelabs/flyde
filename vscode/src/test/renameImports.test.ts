import * as assert from "assert";
import * as fs from "fs";
import * as path from "path";
import * as vscode from "vscode";
import {
  deserializeFlow,
  serializeFlow,
  resolveFlowByPath,
} from "@flyde/loader/dist/server";

suite("Rename imports integration", () => {
  let root: vscode.Uri;
  const uri = (name: string) => vscode.Uri.joinPath(root, name);
  const source = (text: string) => {
    const instance = deserializeFlow(text, "main.flyde").node.instances[0];
    return "data" in instance.source ? instance.source.data : undefined;
  };
  const showForDemo = async (document: vscode.TextDocument) => {
    if (process.env.FLYDE_RENAME_DEMO !== "true") {
      return;
    }
    const editor = await vscode.window.showTextDocument(document);
    const offset = document.getText().indexOf("type: file");
    const position = document.positionAt(Math.max(0, offset));
    editor.revealRange(
      new vscode.Range(position, position),
      vscode.TextEditorRevealType.InCenter,
    );
    await new Promise((resolve) => setTimeout(resolve, 4000));
  };

  suiteSetup(async () => {
    const workspace = vscode.workspace.workspaceFolders?.[0];
    assert.ok(workspace, "Launch the test host with a temporary workspace");
    root = vscode.Uri.file(
      fs.mkdtempSync(path.join(workspace.uri.fsPath, "flyde-rename-")),
    );
    const extension = vscode.extensions.getExtension("flyde.flyde-vscode");
    assert.ok(extension, "Development extension must be available");
    await extension.activate();
  });

  test("updates a real rename while preserving unsaved flow changes", async () => {
    const fixture = fs.readFileSync(
      path.resolve(
        __dirname,
        "../../test-fixtures/nested-flows/ParentFlow.flyde",
      ),
      "utf8",
    );
    const flow = deserializeFlow(fixture, "main.flyde");
    flow.node.instances[0].source = { type: "file", data: "./child.flyde" };
    await vscode.workspace.fs.writeFile(
      uri("main.flyde"),
      Buffer.from(serializeFlow(flow)),
    );
    await vscode.workspace.fs.writeFile(
      uri("child.flyde"),
      fs.readFileSync(
        path.resolve(
          __dirname,
          "../../test-fixtures/nested-flows/ChildFlow.flyde",
        ),
      ),
    );
    await vscode.workspace.fs.writeFile(
      uri("broken.flyde"),
      Buffer.from("node: [invalid"),
    );
    await vscode.workspace.fs.createDirectory(uri("nested"));
    const document = await vscode.workspace.openTextDocument(uri("main.flyde"));
    const unsaved = deserializeFlow(document.getText(), document.fileName);
    unsaved.node.description = "unsaved rename regression";
    const edit = new vscode.WorkspaceEdit();
    edit.replace(
      document.uri,
      new vscode.Range(
        document.positionAt(0),
        document.positionAt(document.getText().length),
      ),
      serializeFlow(unsaved),
    );
    assert.ok(await vscode.workspace.applyEdit(edit));
    assert.ok(document.isDirty);
    await showForDemo(document);
    const rename = new vscode.WorkspaceEdit();
    rename.renameFile(uri("child.flyde"), uri("nested/child.flyde"));
    assert.ok(await vscode.workspace.applyEdit(rename));
    await showForDemo(document);
    assert.strictEqual(source(document.getText()), "./nested/child.flyde");
    assert.strictEqual(
      deserializeFlow(document.getText(), document.fileName).node.description,
      "unsaved rename regression",
    );
    assert.ok(document.isDirty);
    assert.strictEqual(
      Buffer.from(
        await vscode.workspace.fs.readFile(uri("broken.flyde")),
      ).toString(),
      "node: [invalid",
    );
    await vscode.workspace.fs.stat(uri("nested/child.flyde"));
    assert.ok(await document.save());
    assert.doesNotThrow(() => resolveFlowByPath(document.fileName));
  });

  test("updates imports when the dependency folder is renamed", async () => {
    const fixtures = path.resolve(
      __dirname,
      "../../test-fixtures/nested-flows",
    );
    const parent = deserializeFlow(
      fs.readFileSync(path.join(fixtures, "ParentFlow.flyde"), "utf8"),
      "folder-parent.flyde",
    );
    parent.node.instances[0].source = {
      type: "file",
      data: "./source-folder/ChildFlow.flyde",
    };
    await vscode.workspace.fs.createDirectory(uri("source-folder"));
    await vscode.workspace.fs.writeFile(
      uri("source-folder/ChildFlow.flyde"),
      fs.readFileSync(path.join(fixtures, "ChildFlow.flyde")),
    );
    await vscode.workspace.fs.writeFile(
      uri("folder-parent.flyde"),
      Buffer.from(serializeFlow(parent)),
    );
    const rename = new vscode.WorkspaceEdit();
    rename.renameFile(uri("source-folder"), uri("destination-folder"));
    assert.ok(await vscode.workspace.applyEdit(rename));
    const document = await vscode.workspace.openTextDocument(
      uri("folder-parent.flyde"),
    );
    assert.strictEqual(
      source(document.getText()),
      "./destination-folder/ChildFlow.flyde",
    );
    assert.ok(await document.save());
    assert.doesNotThrow(() => resolveFlowByPath(document.fileName));
  });

  test("rebases an importing flow moved into a folder", async () => {
    const fixture = fs.readFileSync(
      path.resolve(__dirname, "../../test-fixtures/HelloWorld.flyde"),
      "utf8",
    );
    const flow = deserializeFlow(fixture, "importer.flyde");
    flow.node.instances[0].source = {
      type: "file",
      data: "./dependency.flyde",
    };
    await vscode.workspace.fs.writeFile(
      uri("importer.flyde"),
      Buffer.from(serializeFlow(flow)),
    );
    await vscode.workspace.fs.writeFile(
      uri("dependency.flyde"),
      Buffer.from(fixture),
    );
    await vscode.workspace.fs.createDirectory(uri("moved"));
    const rename = new vscode.WorkspaceEdit();
    rename.renameFile(uri("importer.flyde"), uri("moved/importer.flyde"));
    assert.ok(await vscode.workspace.applyEdit(rename));
    const document = await vscode.workspace.openTextDocument(
      uri("moved/importer.flyde"),
    );
    assert.strictEqual(source(document.getText()), "../dependency.flyde");
    const instances = deserializeFlow(document.getText(), document.fileName)
      .node.instances;
    assert.strictEqual(instances[1].source.type, "package");
    assert.deepStrictEqual(instances[1].source, flow.node.instances[1].source);
  });
});
