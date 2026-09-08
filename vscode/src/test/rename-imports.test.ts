import * as assert from "assert";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import {
  updateImportsAfterRename,
  updateFlowImports,
} from "../update-imports-on-rename";

const parentFlowYaml = `imports: {}
node:
  instances:
    - pos:
        x: 300
        y: 200
      id: nested-instance
      inputConfig: {}
      nodeId: ChildFlow
      config: {}
      type: visual
      source:
        type: file
        data: ./ChildFlow.flyde
  connections: []
  id: ParentFlow
  inputs: {}
  outputs: {}
`;

suite("Import updates after file rename", () => {
  let tmpDir: string;

  setup(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "flyde-rename-test-"));
  });

  test("updates flows referencing a moved imported file", () => {
    const parentPath = path.join(tmpDir, "ParentFlow.flyde");
    fs.writeFileSync(parentPath, parentFlowYaml);

    const oldChild = path.join(tmpDir, "ChildFlow.flyde");
    const subDir = path.join(tmpDir, "sub");
    fs.mkdirSync(subDir);
    const newChild = path.join(subDir, "ChildFlow.flyde");

    const updated = updateImportsAfterRename(oldChild, newChild, [parentPath]);

    assert.deepStrictEqual(updated, [parentPath]);
    const text = fs.readFileSync(parentPath, "utf-8");
    assert.ok(
      text.includes("data: ./sub/ChildFlow.flyde"),
      `Expected updated import, got:\n${text}`
    );
  });

  test("updates imports inside the moved flow itself", () => {
    const childPath = path.join(tmpDir, "ChildFlow.flyde");
    fs.writeFileSync(childPath, "imports: {}\nnode: {}\n");

    const oldParent = path.join(tmpDir, "ParentFlow.flyde");
    fs.writeFileSync(oldParent, parentFlowYaml);

    const subDir = path.join(tmpDir, "sub");
    fs.mkdirSync(subDir);
    const newParent = path.join(subDir, "ParentFlow.flyde");
    fs.renameSync(oldParent, newParent);

    const updated = updateImportsAfterRename(oldParent, newParent, [newParent]);

    assert.deepStrictEqual(updated, [newParent]);
    const text = fs.readFileSync(newParent, "utf-8");
    assert.ok(
      text.includes("data: ../ChildFlow.flyde"),
      `Expected updated import, got:\n${text}`
    );
  });

  test("leaves unrelated imports untouched", () => {
    const parentPath = path.join(tmpDir, "ParentFlow.flyde");
    fs.writeFileSync(parentPath, parentFlowYaml);

    const updated = updateImportsAfterRename(
      path.join(tmpDir, "Other.flyde"),
      path.join(tmpDir, "Other2.flyde"),
      [parentPath]
    );

    assert.deepStrictEqual(updated, []);
    const text = fs.readFileSync(parentPath, "utf-8");
    assert.ok(text.includes("data: ./ChildFlow.flyde"));
  });

  test("updateFlowImports returns null when nothing changes", () => {
    const result = updateFlowImports(parentFlowYaml, () => undefined);
    assert.strictEqual(result, null);
  });

  test("updateFlowImports returns null for invalid yaml", () => {
    const result = updateFlowImports("{{{{", () => "./x");
    assert.strictEqual(result, null);
  });

});
