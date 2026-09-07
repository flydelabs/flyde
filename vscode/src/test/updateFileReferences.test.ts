import assert = require("assert");
import * as path from "path";
import type { FlydeFlow } from "@flyde/core";
import { movedPath, updateFileReferences } from "../updateFileReferences";

const root = path.resolve("rename-test-workspace");
const at = (...parts: string[]) => path.join(root, ...parts);
const flow = (reference: string): FlydeFlow => ({
  node: {
    id: "Main", inputs: {}, outputs: {}, connections: [],
    inputsPosition: {}, outputsPosition: {},
    instances: [{
      id: "dependency", type: "code", nodeId: "Dependency",
      source: { type: "file", data: reference },
      config: {}, inputConfig: {}, pos: { x: 0, y: 0 },
    }],
  },
});
const reference = (value: FlydeFlow) => {
  const source = value.node.instances[0].source;
  assert(source.type === "file");
  return source.data;
};

suite("File references after renaming", () => {
  test("updates a moved code dependency", () => {
    const value = flow("./Dependency.flyde.ts");
    assert(updateFileReferences(value, at("Main.flyde"), [
      { oldPath: at("Dependency.flyde.ts"), newPath: at("nodes", "Dependency.flyde.ts") },
    ]));
    assert.strictEqual(reference(value), "./nodes/Dependency.flyde.ts");
  });

  test("rebases imports when the importing flow moves", () => {
    const value = flow("./Dependency.flyde.ts");
    assert(updateFileReferences(value, at("Main.flyde"), [
      { oldPath: at("Main.flyde"), newPath: at("flows", "Main.flyde") },
    ]));
    assert.strictEqual(reference(value), "../Dependency.flyde.ts");
  });

  test("updates external references into a renamed folder", () => {
    const value = flow("./nodes/Dependency.flyde");
    assert(updateFileReferences(value, at("Main.flyde"), [
      { oldPath: at("nodes"), newPath: at("lib") },
    ]));
    assert.strictEqual(reference(value), "./lib/Dependency.flyde");
  });

  test("leaves relative paths unchanged when both files move together", () => {
    const value = flow("Dependency.flyde.ts");
    assert.strictEqual(updateFileReferences(value, at("nodes", "Main.flyde"), [
      { oldPath: at("nodes"), newPath: at("lib") },
    ]), false);
    assert.strictEqual(reference(value), "Dependency.flyde.ts");
  });

  test("does not match a directory with a shared name prefix", () => {
    const value = flow("./nodes-extra/Dependency.flyde.ts");
    assert.strictEqual(updateFileReferences(value, at("Main.flyde"), [
      { oldPath: at("nodes"), newPath: at("lib") },
    ]), false);
  });

  test("updates references in inline visual nodes", () => {
    const value = flow("./Dependency.flyde.ts");
    const nested = flow("./Dependency.flyde.ts").node;
    value.node.instances[0] = {
      id: "inline", type: "visual", nodeId: "Nested",
      source: { type: "inline", data: nested },
      inputConfig: {}, pos: { x: 0, y: 0 },
    };
    assert(updateFileReferences(value, at("Main.flyde"), [
      { oldPath: at("Dependency.flyde.ts"), newPath: at("Renamed.flyde.ts") },
    ]));
    assert.strictEqual(reference({ node: nested }), "./Renamed.flyde.ts");
  });

  test("leaves package and custom sources untouched", () => {
    for (const type of ["package", "custom"] as const) {
      const value = flow("./Dependency.flyde.ts");
      value.node.instances[0].source = { type, data: "./Dependency.flyde.ts" };
      assert.strictEqual(updateFileReferences(value, at("Main.flyde"), [
        { oldPath: at("Dependency.flyde.ts"), newPath: at("Renamed.flyde.ts") },
      ]), false);
    }
  });

  test("treats a batch as simultaneous moves instead of chaining targets", () => {
    const value = flow("./A.flyde");
    updateFileReferences(value, at("Main.flyde"), [
      { oldPath: at("A.flyde"), newPath: at("B.flyde") },
      { oldPath: at("B.flyde"), newPath: at("C.flyde") },
    ]);
    assert.strictEqual(reference(value), "./B.flyde");
  });

  test("selects the most specific move in a batch", () => {
    assert.strictEqual(movedPath(at("nodes", "A.flyde"), [
      { oldPath: at("nodes"), newPath: at("lib") },
      { oldPath: at("nodes", "A.flyde"), newPath: at("B.flyde") },
    ]), at("B.flyde"));
  });
});
