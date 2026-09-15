import assert = require("assert");
import * as path from "path";
import type { FlydeFlow } from "@flyde/core";
import { applyMove, updateFileReferences } from "../updateFileReferences";

const root = path.resolve("rename-test-workspace");
const at = (...parts: string[]) => path.join(root, ...parts);

const flowWithFileRef = (reference: string): FlydeFlow => ({
  node: {
    id: "Main",
    inputs: {},
    outputs: {},
    connections: [],
    inputsPosition: {},
    outputsPosition: {},
    instances: [
      {
        id: "dependency",
        type: "code",
        nodeId: "Dependency",
        source: { type: "file", data: reference },
        config: {},
        inputConfig: {},
        pos: { x: 0, y: 0 },
      },
    ],
  },
});

const fileRef = (value: FlydeFlow): string => {
  const source = value.node.instances[0].source;
  assert.strictEqual(source.type, "file");
  return (source as { type: "file"; data: string }).data;
};

suite("updateFileReferences", () => {
  test("rewrites a moved file dependency", () => {
    const value = flowWithFileRef("./Dependency.flyde.ts");
    assert.ok(
      updateFileReferences(value, at("Main.flyde"), [
        {
          oldPath: at("Dependency.flyde.ts"),
          newPath: at("nodes", "Dependency.flyde.ts"),
        },
      ])
    );
    assert.strictEqual(fileRef(value), "./nodes/Dependency.flyde.ts");
  });

  test("rebases imports when the importing flow moves", () => {
    const value = flowWithFileRef("./Dependency.flyde.ts");
    assert.ok(
      updateFileReferences(value, at("Main.flyde"), [
        { oldPath: at("Main.flyde"), newPath: at("flows", "Main.flyde") },
      ])
    );
    assert.strictEqual(fileRef(value), "../Dependency.flyde.ts");
  });

  test("rewrites references into a renamed folder", () => {
    const value = flowWithFileRef("./nodes/Dependency.flyde");
    assert.ok(
      updateFileReferences(value, at("Main.flyde"), [
        { oldPath: at("nodes"), newPath: at("lib") },
      ])
    );
    assert.strictEqual(fileRef(value), "./lib/Dependency.flyde");
  });

  test("leaves relative paths unchanged when both files move together", () => {
    const value = flowWithFileRef("Dependency.flyde.ts");
    assert.strictEqual(
      updateFileReferences(value, at("nodes", "Main.flyde"), [
        { oldPath: at("nodes"), newPath: at("lib") },
      ]),
      false
    );
    assert.strictEqual(fileRef(value), "Dependency.flyde.ts");
  });

  test("does not match a directory that only shares a name prefix", () => {
    const value = flowWithFileRef("./nodes-extra/Dependency.flyde.ts");
    assert.strictEqual(
      updateFileReferences(value, at("Main.flyde"), [
        { oldPath: at("nodes"), newPath: at("lib") },
      ]),
      false
    );
  });

  test("updates references nested inside inline visual nodes", () => {
    const value = flowWithFileRef("./Dependency.flyde.ts");
    const nested = flowWithFileRef("./Dependency.flyde.ts").node;
    value.node.instances[0] = {
      id: "inline",
      type: "visual",
      nodeId: "Nested",
      source: { type: "inline", data: nested },
      inputConfig: {},
      pos: { x: 0, y: 0 },
    };
    assert.ok(
      updateFileReferences(value, at("Main.flyde"), [
        {
          oldPath: at("Dependency.flyde.ts"),
          newPath: at("Renamed.flyde.ts"),
        },
      ])
    );
    assert.strictEqual(fileRef({ node: nested }), "./Renamed.flyde.ts");
  });

  test("leaves package and custom sources untouched", () => {
    for (const type of ["package", "custom"] as const) {
      const value = flowWithFileRef("./Dependency.flyde.ts");
      value.node.instances[0].source = {
        type,
        data: "./Dependency.flyde.ts",
      } as any;
      assert.strictEqual(
        updateFileReferences(value, at("Main.flyde"), [
          {
            oldPath: at("Dependency.flyde.ts"),
            newPath: at("Renamed.flyde.ts"),
          },
        ]),
        false
      );
    }
  });

  test("treats a batch as simultaneous moves (no chaining)", () => {
    const value = flowWithFileRef("./A.flyde");
    updateFileReferences(value, at("Main.flyde"), [
      { oldPath: at("A.flyde"), newPath: at("B.flyde") },
      { oldPath: at("B.flyde"), newPath: at("C.flyde") },
    ]);
    assert.strictEqual(fileRef(value), "./B.flyde");
  });

  test("applyMove prefers the most specific move in a batch", () => {
    assert.strictEqual(
      applyMove(at("nodes", "A.flyde"), [
        { oldPath: at("nodes"), newPath: at("lib") },
        { oldPath: at("nodes", "A.flyde"), newPath: at("B.flyde") },
      ]),
      at("B.flyde")
    );
  });

  test("rewrites deprecated top-level imports map keys", () => {
    const value: FlydeFlow = {
      imports: { "./Child.flyde": ["Child"] },
      node: {
        id: "Main",
        inputs: {},
        outputs: {},
        connections: [],
        inputsPosition: {},
        outputsPosition: {},
        instances: [],
      },
    };
    assert.ok(
      updateFileReferences(value, at("Main.flyde"), [
        { oldPath: at("Child.flyde"), newPath: at("shared", "Child.flyde") },
      ])
    );
    assert.deepStrictEqual(value.imports, {
      "./shared/Child.flyde": ["Child"],
    });
  });
});
