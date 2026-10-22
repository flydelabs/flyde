import * as vscode from "vscode";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import * as assert from "assert";
import { registerFlowRenameHandler } from "../flowRename";

suite("flow rename extension host", () => {
  for (const scenario of ["target", "parent", "folder", "dirty"]) {
    test(scenario, async () => {
      const dir = fs.mkdtempSync(path.join(os.tmpdir(), "flyde-rename-"));
      const parent = path.join(dir, "Parent.flyde");
      const child = path.join(dir, "Child.flyde");
      fs.writeFileSync(child, "node: {}\n");
      fs.writeFileSync(parent, "# preserved\nnode:\n  instances:\n    - source:\n        type: file\n        data: ./Child.flyde\n");
      const subscriptions: vscode.Disposable[] = [];
      registerFlowRenameHandler({ subscriptions });
      try {
        const document = await vscode.workspace.openTextDocument(parent);
        if (scenario === "dirty") {
          const typing = new vscode.WorkspaceEdit();
          typing.insert(document.uri, new vscode.Position(0, 0), "# unsaved edit\n");
          assert.ok(await vscode.workspace.applyEdit(typing));
          assert.ok(document.isDirty);
        }
        let from = child;
        let to = path.join(dir, "New.flyde");
        let expected = "./New.flyde";
        let resultPath = parent;
        if (scenario === "parent") {
          from = parent;
          to = path.join(dir, "nested", "Parent.flyde");
          fs.mkdirSync(path.dirname(to));
          expected = "../Child.flyde";
          resultPath = to;
        } else if (scenario === "folder") {
          from = dir;
          to = `${dir}-moved`;
          expected = "./Child.flyde";
          resultPath = path.join(to, "Parent.flyde");
        }
        const move = new vscode.WorkspaceEdit();
        move.renameFile(vscode.Uri.file(from), vscode.Uri.file(to));
        assert.ok(await vscode.workspace.applyEdit(move));
        const result = await vscode.workspace.openTextDocument(resultPath);
        assert.ok(result.getText().includes(`data: ${expected}`), result.getText());
        assert.ok(result.getText().includes("# preserved"));
        if (scenario === "dirty") {
          assert.ok(result.getText().includes("# unsaved edit"));
          assert.ok(result.isDirty);
        }
        await result.save();
      } finally {
        subscriptions.forEach((subscription) => subscription.dispose());
        fs.rmSync(dir, { recursive: true, force: true });
        if (scenario === "folder") {
          fs.rmSync(`${dir}-moved`, { recursive: true, force: true });
        }
      }
    });
  }
});
