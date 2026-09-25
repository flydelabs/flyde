import * as assert from "assert";
import * as path from "path";
import { updateMovedFlydeImportsInText } from "../updateMovedFlydeImports";

suite("updateMovedFlydeImportsInText", () => {
  test("updates local visual node imports when a referenced .flyde file is moved", () => {
    const flowPath = path.join("/workspace", "flows", "main.flyde");
    const original = `imports:\n  "./nodes/add-one.flyde": AddOne\n  "@flyde/nodes": Add\nnode:\n  id: Main\n  inputs: {}\n  outputs: {}\n  instances: []\n  connections: []\n  inputsPosition: {}\n  outputsPosition: {}\n`;

    const updated = updateMovedFlydeImportsInText(original, flowPath, [
      {
        oldPath: path.join("/workspace", "flows", "nodes", "add-one.flyde"),
        newPath: path.join("/workspace", "shared", "add-one.flyde"),
      },
    ]);

    assert.ok(updated);
    assert.match(updated, /\.\.\/shared\/add-one\.flyde/);
    assert.doesNotMatch(updated, /\.\/nodes\/add-one\.flyde/);
    assert.match(updated, /@flyde\/nodes/);
  });

  test("returns undefined when no local imports match the moved file", () => {
    const flowPath = path.join("/workspace", "flows", "main.flyde");
    const original = `imports:\n  "./nodes/add-one.flyde": AddOne\nnode:\n  id: Main\n  inputs: {}\n  outputs: {}\n  instances: []\n  connections: []\n  inputsPosition: {}\n  outputsPosition: {}\n`;

    const updated = updateMovedFlydeImportsInText(original, flowPath, [
      {
        oldPath: path.join("/workspace", "other", "add-one.flyde"),
        newPath: path.join("/workspace", "shared", "add-one.flyde"),
      },
    ]);

    assert.equal(updated, undefined);
  });
});

