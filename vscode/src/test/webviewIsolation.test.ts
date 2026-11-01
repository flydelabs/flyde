import * as assert from "assert";
import * as fs from "fs";
import * as path from "path";
import * as vscode from "vscode";
import { eventually } from "@flyde/core";
import { getLastWebviewForTests } from "../flydeEditor";
import { openFlydeFile, waitForFlowEditor } from "./pageObjects";
import { webviewTestingCommand } from "./testUtils";

suite("Webview test isolation", () => {
  test("does not reuse a valid editor when a subsequent flow cannot resolve", async () => {
    const workspace = vscode.workspace.workspaceFolders?.[0];
    assert.ok(workspace);
    const root = fs.mkdtempSync(
      path.join(workspace.uri.fsPath, "webview-isolation-"),
    );
    const fixture = fs.readFileSync(
      path.resolve(__dirname, "../../test-fixtures/HelloWorld.flyde"),
      "utf8",
    );
    const valid = path.join(root, "valid.flyde");
    fs.writeFileSync(valid, fixture);
    await openFlydeFile(valid);
    await waitForFlowEditor();
    const previous = getLastWebviewForTests();
    assert.ok(previous);
    const broken = path.join(root, "broken.flyde");
    fs.writeFileSync(broken, "node: [invalid");
    await openFlydeFile(broken);
    assert.notStrictEqual(getLastWebviewForTests(), previous);
    await assert.rejects(
      webviewTestingCommand("$$", { selector: ".flyde-flow-editor" }),
      /timed out/,
    );
    await vscode.commands.executeCommand("workbench.action.closeAllEditors");
    await eventually(() => assert.strictEqual(getLastWebviewForTests(), null), 2000);
  }).timeout(15000);
});
