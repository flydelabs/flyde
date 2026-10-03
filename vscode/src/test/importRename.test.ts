import * as assert from "assert";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import * as vscode from "vscode";
import { deserializeFlow } from "@flyde/loader";
import { eventually } from "@flyde/core";
import { addNodeFromMenu, getInstances, openFlydeFile, waitForFlowEditor, waitForInstanceCount } from "./pageObjects";

const flow = (reference: string) => `# Preserve this comment\nnode:\n  id: Parent\n  instances:\n    - id: child\n      source: { type: file, data: '${reference}' }\n`;

suite("Imported flow renames", () => {
  let root: string;
  const documents = new Set<vscode.TextDocument>();

  suiteSetup(async () => {
    const extension = vscode.extensions.getExtension("flyde.flyde-vscode");
    assert.ok(extension, "The development extension must be loaded");
    await extension.activate(); // Never register a second rename handler in tests.
    root = fs.mkdtempSync(path.join(os.tmpdir(), "flyde-import-renames-"));
    const existing = vscode.workspace.workspaceFolders?.length ?? 0;
    assert.ok(existing > 0, "Launch tests with an initial workspace to avoid restarting the extension host");
    const changed = new Promise<void>((resolve) => {
      const listener = vscode.workspace.onDidChangeWorkspaceFolders(() => {
        listener.dispose();
        resolve();
      });
    });
    assert.strictEqual(vscode.workspace.updateWorkspaceFolders(existing, 0, { uri: vscode.Uri.file(root) }), true);
    await changed;
  });

  teardown(async () => {
    for (const document of documents) {
      if (!document.isClosed && document.isDirty) { await document.save(); }
    }
    documents.clear();
    await vscode.commands.executeCommand("workbench.action.closeAllEditors");
  });

  suiteTeardown(() => {
    const index = vscode.workspace.workspaceFolders?.findIndex((folder) => folder.uri.fsPath === root);
    if (index !== undefined && index > 0) {
      vscode.workspace.updateWorkspaceFolders(index, 1);
    }
    if (root) { fs.rmSync(root, { recursive: true, force: true }); }
  });

  function write(relative: string, text: string): vscode.Uri {
    const file = path.join(root, relative);
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, text);
    return vscode.Uri.file(file);
  }

  async function open(uri: vscode.Uri): Promise<vscode.TextDocument> {
    const document = await vscode.workspace.openTextDocument(uri);
    documents.add(document);
    return document;
  }

  async function rename(pairs: [vscode.Uri, vscode.Uri][]): Promise<void> {
    const edit = new vscode.WorkspaceEdit();
    for (const [from, to] of pairs) { edit.renameFile(from, to); }
    assert.strictEqual(await vscode.workspace.applyEdit(edit), true);
  }

  test("repairs a dirty consumer without discarding its unsaved change", async () => {
    const dependency = write("dirty/Child.flyde", "node: { id: Child, instances: [] }\n");
    const parent = write("dirty/Parent.flyde", flow("./Child.flyde"));
    const document = await open(parent);
    const edit = new vscode.WorkspaceEdit();
    edit.insert(parent, document.positionAt(document.getText().length), "# Unsaved user change\n");
    assert.strictEqual(await vscode.workspace.applyEdit(edit), true);
    fs.mkdirSync(path.join(root, "dirty/lib"));
    await rename([[dependency, vscode.Uri.file(path.join(root, "dirty/lib/Child.flyde"))]]);
    assert.ok(document.getText().includes("'./lib/Child.flyde'"));
    assert.ok(document.getText().endsWith("# Unsaved user change\n"));
    assert.strictEqual(document.isDirty, true);
    assert.strictEqual(fs.readFileSync(parent.fsPath, "utf8"), flow("./Child.flyde"));
  });

  test("rebases a moved importer against the dependency's original location", async () => {
    write("importer/Child.flyde", "node: { id: Child, instances: [] }\n");
    const oldParent = write("importer/Parent.flyde", flow("./Child.flyde"));
    fs.mkdirSync(path.join(root, "importer/deeper"));
    const newParent = vscode.Uri.file(path.join(root, "importer/deeper/Parent.flyde"));
    await rename([[oldParent, newParent]]);
    const document = await open(newParent);
    assert.ok(document.getText().includes("'../Child.flyde'"));
  });

  test("handles one batch moving both the importer and its dependency", async () => {
    const dependency = write("batch/Child.flyde", "node: { id: Child, instances: [] }\n");
    const parent = write("batch/Parent.flyde", flow("./Child.flyde"));
    fs.mkdirSync(path.join(root, "batch/moved"));
    const newParent = vscode.Uri.file(path.join(root, "batch/moved/Parent.flyde"));
    await rename([
      [parent, newParent],
      [dependency, vscode.Uri.file(path.join(root, "batch/moved/Renamed.flyde"))],
    ]);
    assert.ok((await open(newParent)).getText().includes("'./Renamed.flyde'"));
  });

  test("repairs a folder move while preserving prefix siblings and malformed neighbors", async () => {
    write("folder/lib/Child.flyde", "node: { id: Child, instances: [] }\n");
    write("folder/library/Other.flyde", "node: { id: Other, instances: [] }\n");
    const parent = write("folder/Parent.flyde", flow("./lib/Child.flyde"));
    const sibling = write("folder/Sibling.flyde", flow("./library/Other.flyde"));
    const malformed = write("folder/Invalid.flyde", "node: [\n");
    await rename([[
      vscode.Uri.file(path.join(root, "folder/lib")),
      vscode.Uri.file(path.join(root, "folder/components")),
    ]]);
    assert.ok((await open(parent)).getText().includes("'./components/Child.flyde'"));
    assert.strictEqual((await open(sibling)).getText(), flow("./library/Other.flyde"));
    assert.strictEqual(fs.readFileSync(malformed.fsPath, "utf8"), "node: [\n");
  });

  test("a visual edit after moving a dependency keeps the repaired import without reopening", async () => {
    const assertRepairedPath = (value: ReturnType<typeof deserializeFlow>) => {
      const child = value.node.instances.find((instance) => instance.id === "nested-instance");
      assert.ok(child && child.source.type === "file", "Expected the imported child flow");
      assert.strictEqual(child.source.data, "./components/ChildFlow.flyde");
    };
    const fixtures = path.resolve(__dirname, "../../test-fixtures/nested-flows");
    const parent = write("visual/ParentFlow.flyde", fs.readFileSync(path.join(fixtures, "ParentFlow.flyde"), "utf8"));
    const dependency = write("visual/ChildFlow.flyde", fs.readFileSync(path.join(fixtures, "ChildFlow.flyde"), "utf8"));
    const document = await open(parent);
    await openFlydeFile(parent.fsPath);
    await waitForFlowEditor();
    await eventually(async () => assert.ok((await getInstances()).some((instance) => instance.textContent?.includes("ChildFlow"))), 4000);
    await addNodeFromMenu("Value");
    await waitForInstanceCount(2);
    await eventually(() => assert.strictEqual(deserializeFlow(document.getText(), parent.fsPath).node.instances.length, 2), 4000);

    fs.mkdirSync(path.join(root, "visual/components"));
    await rename([[dependency, vscode.Uri.file(path.join(root, "visual/components/ChildFlow.flyde"))]]);
    await eventually(() => {
      assertRepairedPath(deserializeFlow(document.getText(), parent.fsPath));
    }, 4000);
    await eventually(async () => {
      const instances = await getInstances();
      assert.ok(instances.some((instance) => instance.textContent?.includes("ChildFlow")), "The moved child must resolve in the open editor");
      assert.ok(instances.every((instance) => !instance.textContent?.includes("Error")), "The editor must not keep a temporary unresolved node");
    }, 4000);

    // The next edit uses the still-open visual editor's state, not a fresh load.
    await addNodeFromMenu("Value");
    await waitForInstanceCount(3);
    await eventually(() => {
      const instances = deserializeFlow(document.getText(), parent.fsPath).node.instances;
      assert.strictEqual(instances.length, 3);
      assertRepairedPath(deserializeFlow(document.getText(), parent.fsPath));
    }, 4000);
    assert.strictEqual(await document.save(), true);
    const saved = deserializeFlow(fs.readFileSync(parent.fsPath, "utf8"), parent.fsPath);
    assert.strictEqual(saved.node.instances.length, 3);
    assertRepairedPath(saved);
  }).timeout(20000);
});
