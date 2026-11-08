import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";
import assert = require("assert");
import { delay, eventually } from "@flyde/core";
import { deserializeFlow } from "@flyde/loader/dist/server";
import { copyRecursive } from "../testFileUtils";
import {
  addNodeFromMenu,
  getInstances,
  openFlydeFile,
  waitForFlowEditor,
  waitForInstanceCount,
} from "../pageObjects";

const fixturesDir = path.resolve(__dirname, "../../../test-fixtures");

function importsOf(content: string): unknown[] {
  const flow = deserializeFlow(content, "test.flyde");
  return flow.node.instances.map((instance) => (instance.source as { data?: unknown }).data);
}

function readImports(flowPath: string): unknown[] {
  return importsOf(fs.readFileSync(flowPath, "utf8"));
}

async function move(from: string, to: string) {
  const edit = new vscode.WorkspaceEdit();
  edit.renameFile(vscode.Uri.file(from), vscode.Uri.file(to));
  assert(await vscode.workspace.applyEdit(edit), `Failed to move ${from}`);
}

async function setMode(mode: "prompt" | "always" | "never" | undefined) {
  await vscode.workspace
    .getConfiguration("flyde")
    .update("updateImportsOnFileMove.enabled", mode, vscode.ConfigurationTarget.Global);
}

suite("Update imports on file move", () => {
  let root: string;
  let parent: string;
  let child: string;

  suiteSetup(async () => {
    await vscode.extensions.getExtension("flyde.flyde-vscode")?.activate();
  });

  setup(async () => {
    await setMode("always");
    const workspaceRoot = vscode.workspace.workspaceFolders![0].uri.fsPath;
    root = fs.mkdtempSync(path.join(workspaceRoot, "case-"));
    copyRecursive(path.join(fixturesDir, "nested-flows"), root);
    parent = path.join(root, "ParentFlow.flyde");
    child = path.join(root, "ChildFlow.flyde");
  });

  teardown(async () => {
    await vscode.commands.executeCommand("workbench.action.closeAllEditors");
    await setMode(undefined);
  });

  test("updates flows that import a moved file", async () => {
    await move(child, path.join(root, "shared", "ChildFlow.flyde"));

    await eventually(() => {
      assert.deepStrictEqual(readImports(parent), ["./shared/ChildFlow.flyde"]);
    }, 5000);
  });

  test("updates the imports of a moved flow", async () => {
    await move(parent, path.join(root, "flows", "ParentFlow.flyde"));

    await eventually(() => {
      assert.deepStrictEqual(
        readImports(path.join(root, "flows", "ParentFlow.flyde")),
        ["../ChildFlow.flyde"]
      );
    }, 5000);
  });

  test("updates imports when a folder moves", async () => {
    await move(child, path.join(root, "lib", "ChildFlow.flyde"));
    await eventually(() => {
      assert.deepStrictEqual(readImports(parent), ["./lib/ChildFlow.flyde"]);
    }, 5000);

    await move(path.join(root, "lib"), path.join(root, "shared", "lib"));

    await eventually(() => {
      assert.deepStrictEqual(readImports(parent), ["./shared/lib/ChildFlow.flyde"]);
    }, 5000);
  });

  test("keeps an open flow editor in sync so later edits keep the new import", async () => {
    await openFlydeFile(parent);
    await waitForFlowEditor();
    await waitForInstanceCount(1);

    await move(child, path.join(root, "shared", "ChildFlow.flyde"));
    await eventually(() => {
      assert.deepStrictEqual(readImports(parent), ["./shared/ChildFlow.flyde"]);
    }, 5000);

    const document = await vscode.workspace.openTextDocument(parent);
    await addNodeFromMenu("Value");
    await waitForInstanceCount(2);

    await eventually(() => {
      assert.strictEqual(
        importsOf(document.getText()).length,
        2,
        "Expected the editor to write the added node"
      );
    }, 5000);
    await document.save();

    assert.strictEqual(readImports(parent)[0], "./shared/ChildFlow.flyde");

    const instances = await getInstances();
    assert(
      instances.some((instance) => instance.textContent?.includes("ChildFlow")),
      "Expected the moved ChildFlow to still render in the editor"
    );
  }).retries(2);

  test("leaves imports untouched when disabled", async () => {
    await setMode("never");

    await move(child, path.join(root, "shared", "ChildFlow.flyde"));
    await delay(1500);

    assert.deepStrictEqual(readImports(parent), ["./ChildFlow.flyde"]);
  });
});
