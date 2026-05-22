import * as assert from "assert";
import * as path from "path";
import { FlydeFlow } from "@flyde/core";
import { updateMovedFlydeImportPaths } from "./update-flyde-import-paths";

const makeFlow = (sourcePath: string): FlydeFlow => ({
  imports: {},
  node: {
    id: "ParentFlow",
    inputs: {},
    outputs: {},
    inputsPosition: {},
    outputsPosition: {},
    instances: [
      {
        id: "child",
        pos: { x: 0, y: 0 },
        inputConfig: {},
        nodeId: "ChildFlow",
        type: "visual",
        source: {
          type: "file",
          data: sourcePath,
        },
      },
    ],
    connections: [],
  },
});

suite("updateMovedFlydeImportPaths", () => {
  test("rewrites file source paths when an imported flow is moved", () => {
    const root = path.resolve("workspace");
    const flowPath = path.join(root, "flows", "Parent.flyde");
    const flow = makeFlow("./Child.flyde");

    const changed = updateMovedFlydeImportPaths(flow, flowPath, [
      {
        oldPath: path.join(root, "flows", "Child.flyde"),
        newPath: path.join(root, "shared", "Child.flyde"),
      },
    ]);

    assert.strictEqual(changed, true);
    assert.strictEqual(
      (flow.node.instances[0].source as { data: string }).data,
      "../shared/Child.flyde"
    );
  });

  test("rewrites imports when a containing folder is moved", () => {
    const root = path.resolve("workspace");
    const flowPath = path.join(root, "flows", "Parent.flyde");
    const flow = makeFlow("./nested/Child.flyde");

    flow.imports = {
      "./nested/Child.flyde": ["ChildFlow"],
    };

    const changed = updateMovedFlydeImportPaths(flow, flowPath, [
      {
        oldPath: path.join(root, "flows", "nested"),
        newPath: path.join(root, "shared", "nested"),
      },
    ]);

    assert.strictEqual(changed, true);
    assert.strictEqual(
      (flow.node.instances[0].source as { data: string }).data,
      "../shared/nested/Child.flyde"
    );
    assert.deepStrictEqual(flow.imports, {
      "../shared/nested/Child.flyde": ["ChildFlow"],
    });
  });

  test("rewrites file source paths when the parent flow moves", () => {
    const root = path.resolve("workspace");
    const flow = makeFlow("./Child.flyde");

    const changed = updateMovedFlydeImportPaths(
      flow,
      path.join(root, "archive", "Parent.flyde"),
      [
        {
          oldPath: path.join(root, "flows", "Parent.flyde"),
          newPath: path.join(root, "archive", "Parent.flyde"),
        },
      ]
    );

    assert.strictEqual(changed, true);
    assert.strictEqual(
      (flow.node.instances[0].source as { data: string }).data,
      "../flows/Child.flyde"
    );
  });

  test("leaves package and custom sources unchanged", () => {
    const root = path.resolve("workspace");
    const flowPath = path.join(root, "flows", "Parent.flyde");
    const flow = makeFlow("@flyde/nodes");

    flow.node.instances[0].source = {
      type: "package",
      data: "@flyde/nodes",
    };

    const changed = updateMovedFlydeImportPaths(flow, flowPath, [
      {
        oldPath: path.join(root, "flows", "Child.flyde"),
        newPath: path.join(root, "shared", "Child.flyde"),
      },
    ]);

    assert.strictEqual(changed, false);
    assert.strictEqual(
      (flow.node.instances[0].source as { data: string }).data,
      "@flyde/nodes"
    );
  });
});
