import assert = require("assert");
import * as vscode from "vscode";
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "fs";
import { tmpdir } from "os";
import { dirname, join } from "path";
import { deserializeFlow, createServerReferencedNodeFinder } from "@flyde/loader/dist/server";
import { eventually } from "@flyde/core";
import { addNodeFromMenu, getInstances, openFlydeFile, waitForFlowEditor } from "./pageObjects";
import sinon = require("sinon");
import * as webviewContent from "../editor/open-flyde-panel";

suite("File move import integration", () => {
  let root: string;
  const fixtureRoots: string[] = [];
  const child = "node:\n  id: Child\n  inputs: {}\n  outputs: {}\n  instances: []\n  connections: []\n";
  const main = (reference: string) => `# preserved\nnode:\n  id: Main\n  inputs: {}\n  outputs: {}\n  instances:\n    - id: child\n      type: visual\n      nodeId: Child\n      source: {type: file, data: '${reference}'} # source comment\n      inputConfig: {}\n      pos: {x: 0, y: 0}\n  connections: []\n`;
  const uri = (name: string) => vscode.Uri.file(join(root, name));
  const write = (name: string, contents: string) => {
    mkdirSync(dirname(join(root, name)), { recursive: true });
    writeFileSync(join(root, name), contents);
  };
  const rename = async (oldName: string, newName: string) => {
    mkdirSync(dirname(join(root, newName)), { recursive: true });
    const edit = new vscode.WorkspaceEdit();
    edit.renameFile(uri(oldName), uri(newName));
    assert(await vscode.workspace.applyEdit(edit), "VS Code rename must succeed");
  };
  const resolves = (document: vscode.TextDocument) => {
    const flow = deserializeFlow(document.getText(), document.uri.fsPath);
    const node = createServerReferencedNodeFinder(document.uri.fsPath)(flow.node.instances[0]);
    assert.equal(node.id, "Child", "real loader must resolve the moved dependency");
  };

  suiteSetup(async () => {
    const extension = vscode.extensions.getExtension("flyde.flyde-vscode");
    assert(extension, "development extension must be installed");
    await extension.activate();
  });
  setup(() => {
    root = mkdtempSync(join(tmpdir(), "flyde-move-imports-"));
    fixtureRoots.push(root);
  });
  teardown(async () => {
    await vscode.commands.executeCommand("workbench.action.closeAllEditors");
    // Save participants' edits before deleting this isolated fixture.
    for (const document of vscode.workspace.textDocuments) {
      if (document.uri.fsPath.startsWith(root)) { await document.save(); }
    }
  });
  suiteTeardown(async () => {
    // VS Code local history copies saved fixtures asynchronously.
    await new Promise(resolve => setTimeout(resolve, 500));
    for (const directory of fixtureRoots) { rmSync(directory, { recursive: true, force: true }); }
  });

  test("moving an imported flow preserves resolution and YAML comments", async () => {
    const before = main("./Child.flyde");
    write("Child.flyde", child);
    write("Main.flyde", before);
    const document = await vscode.workspace.openTextDocument(uri("Main.flyde"));
    resolves(document);
    await rename("Child.flyde", "parts/Child.flyde");
    resolves(document);
    assert.equal(document.getText(), before.replace("data: './Child.flyde'", 'data: "./parts/Child.flyde"'));
    await document.save();
    assert.equal(readFileSync(uri("Main.flyde").fsPath, "utf8"), document.getText());
  });
  test("a dirty importer keeps unsaved edits and is not implicitly saved", async () => {
    write("Child.flyde", child);
    write("Main.flyde", main("./Child.flyde"));
    const document = await vscode.workspace.openTextDocument(uri("Main.flyde"));
    const edit = new vscode.WorkspaceEdit();
    edit.insert(document.uri, new vscode.Position(0, 0), "# unsaved note\n");
    assert(await vscode.workspace.applyEdit(edit));
    await rename("Child.flyde", "parts/Child.flyde");
    assert(document.getText().startsWith("# unsaved note\n"));
    assert(document.isDirty);
    assert.equal(readFileSync(document.uri.fsPath, "utf8"), main("./Child.flyde"));
    resolves(document);
  });
  test("moving the importer rebases its imports at the original URI", async () => {
    write("Child.flyde", child);
    write("Main.flyde", main("./Child.flyde"));
    await vscode.workspace.openTextDocument(uri("Main.flyde"));
    await rename("Main.flyde", "flows/Main.flyde");
    const document = await vscode.workspace.openTextDocument(uri("flows/Main.flyde"));
    resolves(document);
    assert(document.getText().includes('data: "../Child.flyde"'));
  });
  test("folder moves update descendants without matching prefix siblings", async () => {
    write("parts/Child.flyde", child);
    write("parts-extra/Child.flyde", child);
    write("Main.flyde", main("./parts/Child.flyde"));
    write("Other.flyde", main("./parts-extra/Child.flyde"));
    const mainDocument = await vscode.workspace.openTextDocument(uri("Main.flyde"));
    const otherDocument = await vscode.workspace.openTextDocument(uri("Other.flyde"));
    const otherBefore = otherDocument.getText();
    await rename("parts", "library");
    resolves(mainDocument);
    assert.equal(otherDocument.getText(), otherBefore);
  });
  test("one malformed neighbor does not prevent fixing a valid flow", async () => {
    write("Child.flyde", child);
    write("Main.flyde", main("./Child.flyde"));
    write("Invalid.flyde", "node: [");
    const document = await vscode.workspace.openTextDocument(uri("Main.flyde"));
    const invalid = await vscode.workspace.openTextDocument(uri("Invalid.flyde"));
    await rename("Child.flyde", "parts/Child.flyde");
    resolves(document);
    assert.equal(invalid.getText(), "node: [");
  });
  test("an open visual editor keeps renamed imports through another visual save", async () => {
    write("Child.flyde", child);
    write("Main.flyde", main("./Child.flyde"));
    const document = await vscode.workspace.openTextDocument(uri("Main.flyde"));
    await openFlydeFile(document.uri.fsPath);
    console.log("move regression: opened original panel");
    await waitForFlowEditor();
    console.log("move regression: editor ready, saving first visual edit");
    await addNodeFromMenu("Value");
    console.log("move regression: first edit submitted");
    await eventually(() => assert.equal(deserializeFlow(document.getText(), document.uri.fsPath).node.instances.length, 2), 5000);
    await rename("Child.flyde", "parts/Child.flyde");
    console.log("move regression: renamed dependency");
    await waitForFlowEditor(10000);
    await eventually(async () => assert((await getInstances()).some(instance => instance.textContent?.includes("Child"))), 5000);
    await addNodeFromMenu("Value");
    console.log("move regression: second edit submitted");
    await eventually(() => assert.equal(deserializeFlow(document.getText(), document.uri.fsPath).node.instances.length, 3), 5000);
    resolves(document);
    const source = deserializeFlow(document.getText(), document.uri.fsPath).node.instances[0].source;
    assert(source.type === "file");
    assert.equal(source.data, "./parts/Child.flyde");
  });
  test("an open importing flow can move and save from the same visual panel", async () => {
    write("Child.flyde", child);
    write("Main.flyde", main("./Child.flyde"));
    await openFlydeFile(uri("Main.flyde").fsPath);
    await waitForFlowEditor();
    await rename("Main.flyde", "flows/Main.flyde");
    await waitForFlowEditor(10000);
    await addNodeFromMenu("Value");
    const document = await vscode.workspace.openTextDocument(uri("flows/Main.flyde"));
    await eventually(() => assert.equal(deserializeFlow(document.getText(), document.uri.fsPath).node.instances.length, 2), 5000);
    resolves(document);
    const source = deserializeFlow(document.getText(), document.uri.fsPath).node.instances[0].source;
    assert(source.type === "file");
    assert.equal(source.data, "../Child.flyde");
  });
  test("cancelling the rename token leaves the existing visual editor able to save", async () => {
    write("Child.flyde", child);
    write("Main.flyde", main("./Child.flyde"));
    const document = await vscode.workspace.openTextDocument(uri("Main.flyde"));
    const registration = sinon.spy(vscode.workspace, "onWillRenameFiles");
    const cancellation = new vscode.CancellationTokenSource();
    try {
      await openFlydeFile(document.uri.fsPath);
      await waitForFlowEditor();
      const listener = registration.lastCall.args[0];
      assert.equal(typeof listener, "function");
      listener({files: [{oldUri: uri("Child.flyde"), newUri: uri("parts/Child.flyde")}], token: cancellation.token, waitUntil: () => {}});
      cancellation.cancel();
      await addNodeFromMenu("Value");
      await eventually(() => assert.equal(deserializeFlow(document.getText(), document.uri.fsPath).node.instances.length, 2), 5000);
      resolves(document);
    } finally {
      registration.restore();
      cancellation.dispose();
    }
  });
  test("an edit made during rename refresh survives the next visual save", async () => {
    write("Child.flyde", child);
    write("Main.flyde", main("./Child.flyde"));
    const document = await vscode.workspace.openTextDocument(uri("Main.flyde"));
    await openFlydeFile(document.uri.fsPath);
    await waitForFlowEditor();
    const originalContent = webviewContent.getWebviewContent;
    let release: (() => void) | undefined;
    let entered: (() => void) | undefined;
    const enteredManifest = new Promise<void>(resolve => { entered = resolve; });
    const continueManifest = new Promise<void>(resolve => { release = resolve; });
    let delayed = false;
    const manifest = sinon.stub(webviewContent, "getWebviewContent").callsFake(async params => {
      const contents = await originalContent(params);
      if (!delayed) {
        delayed = true;
        entered!();
        await continueManifest;
      }
      return contents;
    });
    try {
      await rename("Child.flyde", "parts/Child.flyde");
      await enteredManifest;
      const edit = new vscode.WorkspaceEdit();
      edit.insert(document.uri, new vscode.Position(3, 0), "  description: Edited during refresh\n");
      assert(await vscode.workspace.applyEdit(edit));
      release!();
      await waitForFlowEditor(10000);
      await addNodeFromMenu("Value");
      await eventually(() => assert.equal(deserializeFlow(document.getText(), document.uri.fsPath).node.instances.length, 2), 5000);
      assert.equal(deserializeFlow(document.getText(), document.uri.fsPath).node.description, "Edited during refresh");
      resolves(document);
    } finally {
      release!();
      manifest.restore();
    }
  });
});
