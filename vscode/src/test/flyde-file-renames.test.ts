import * as path from "path";
import assert = require("assert");
import { FlydeFlow } from "@flyde/core";
import { rewriteRenamedFileReferences } from "../flyde-file-rename-utils";

suite("Flyde file rename references", () => {
  test("updates relative imports when an imported flow moves", () => {
    const root = path.join(path.sep, "workspace", "project");
    const flowPath = path.join(root, "ParentFlow.flyde");
    const flow = createFlowWithImport("ChildFlow.flyde");

    const changed = rewriteRenamedFileReferences(flow, flowPath, [
      {
        oldPath: path.join(root, "ChildFlow.flyde"),
        newPath: path.join(root, "nested", "ChildFlow.flyde"),
      },
    ]);

    assert.strictEqual(changed, true);
    assert.strictEqual(getImportedPath(flow), "nested/ChildFlow.flyde");
  });

  test("updates imports when a folder containing imported flows moves", () => {
    const root = path.join(path.sep, "workspace", "project");
    const flowPath = path.join(root, "ParentFlow.flyde");
    const flow = createFlowWithImport("nodes/ChildFlow.flyde");

    const changed = rewriteRenamedFileReferences(flow, flowPath, [
      {
        oldPath: path.join(root, "nodes"),
        newPath: path.join(root, "shared", "nodes"),
      },
    ]);

    assert.strictEqual(changed, true);
    assert.strictEqual(getImportedPath(flow), "shared/nodes/ChildFlow.flyde");
  });
});

function createFlowWithImport(importPath: string): FlydeFlow {
  return {
    node: {
      id: "ParentFlow",
      inputs: {},
      outputs: {},
      inputsPosition: {},
      outputsPosition: {},
      instances: [
        {
          id: "child",
          nodeId: "ChildFlow",
          type: "visual",
          source: { type: "file", data: importPath },
          inputConfig: {},
          pos: { x: 0, y: 0 },
        },
      ],
      connections: [],
    },
  };
}

function getImportedPath(flow: FlydeFlow): string {
  const source = flow.node.instances[0].source;
  assert(source.type === "file");
  return source.data;
}
