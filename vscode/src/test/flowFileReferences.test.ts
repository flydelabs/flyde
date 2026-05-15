import * as path from "path";
import assert = require("assert");

import { FlydeFlow } from "@flyde/core";
import { deserializeFlow } from "@flyde/loader/dist/server";
import {
  RenamePath,
  updateFlowFileReferences,
} from "../flowFileReferences";

const createFlow = (instances: any[]): FlydeFlow => ({
  node: {
    id: "ParentFlow",
    inputs: {},
    outputs: {},
    inputsPosition: {},
    outputsPosition: {},
    connections: [],
    instances,
  },
});

const visualFileInstance = (sourcePath: string) => ({
  id: "visual-child",
  nodeId: "ChildFlow",
  type: "visual",
  inputConfig: {},
  pos: { x: 0, y: 0 },
  source: {
    type: "file",
    data: sourcePath,
  },
});

const codeFileInstance = (sourcePath: string) => ({
  id: "code-child",
  nodeId: "CodeChild",
  type: "code",
  inputConfig: {},
  config: {},
  pos: { x: 0, y: 0 },
  source: {
    type: "file",
    data: sourcePath,
  },
});

const updateFlow = (
  flow: FlydeFlow,
  currentFlowPath: string,
  renames: readonly RenamePath[]
) => {
  const changed = updateFlowFileReferences(flow, currentFlowPath, renames);
  assert.strictEqual(changed, true);
};

suite("flowFileReferences", () => {
  test("updates flows that import a moved visual flow", () => {
    const root = path.resolve("workspace");
    const parentPath = path.join(root, "ParentFlow.flyde");
    const flow = createFlow([visualFileInstance("./ChildFlow.flyde")]);

    updateFlow(flow, parentPath, [
      {
        oldPath: path.join(root, "ChildFlow.flyde"),
        newPath: path.join(root, "nested", "ChildFlow.flyde"),
      },
    ]);

    assert.strictEqual(
      (flow.node.instances[0] as any).source.data,
      "./nested/ChildFlow.flyde"
    );
  });

  test("updates file imports inside a moved flow", () => {
    const root = path.resolve("workspace");
    const flow = createFlow([visualFileInstance("./ChildFlow.flyde")]);

    updateFlow(flow, path.join(root, "nested", "ParentFlow.flyde"), [
      {
        oldPath: path.join(root, "ParentFlow.flyde"),
        newPath: path.join(root, "nested", "ParentFlow.flyde"),
      },
    ]);

    assert.strictEqual(
      (flow.node.instances[0] as any).source.data,
      "../ChildFlow.flyde"
    );
  });

  test("handles importer and imported flow moving in the same operation", () => {
    const root = path.resolve("workspace");
    const flow = createFlow([visualFileInstance("./ChildFlow.flyde")]);

    updateFlow(flow, path.join(root, "flows", "ParentFlow.flyde"), [
      {
        oldPath: path.join(root, "ParentFlow.flyde"),
        newPath: path.join(root, "flows", "ParentFlow.flyde"),
      },
      {
        oldPath: path.join(root, "ChildFlow.flyde"),
        newPath: path.join(root, "flows", "nested", "ChildFlow.flyde"),
      },
    ]);

    assert.strictEqual(
      (flow.node.instances[0] as any).source.data,
      "./nested/ChildFlow.flyde"
    );
  });

  test("updates file imports recursively in inline visual nodes", () => {
    const root = path.resolve("workspace");
    const parentPath = path.join(root, "ParentFlow.flyde");
    const flow = createFlow([
      {
        id: "inline-wrapper",
        nodeId: "InlineWrapper",
        type: "visual",
        inputConfig: {},
        pos: { x: 0, y: 0 },
        source: {
          type: "inline",
          data: createFlow([visualFileInstance("./ChildFlow.flyde")]).node,
        },
      },
    ]);

    updateFlow(flow, parentPath, [
      {
        oldPath: path.join(root, "ChildFlow.flyde"),
        newPath: path.join(root, "nested", "ChildFlow.flyde"),
      },
    ]);

    assert.strictEqual(
      (flow.node.instances[0] as any).source.data.instances[0].source.data,
      "./nested/ChildFlow.flyde"
    );
  });

  test("updates moved code-node file imports", () => {
    const root = path.resolve("workspace");
    const parentPath = path.join(root, "ParentFlow.flyde");
    const flow = createFlow([codeFileInstance("./CodeChild.flyde.ts")]);

    updateFlow(flow, parentPath, [
      {
        oldPath: path.join(root, "CodeChild.flyde.ts"),
        newPath: path.join(root, "nodes", "CodeChild.flyde.ts"),
      },
    ]);

    assert.strictEqual(
      (flow.node.instances[0] as any).source.data,
      "./nodes/CodeChild.flyde.ts"
    );
  });

  test("updates imports created from legacy top-level import declarations", () => {
    const root = path.resolve("workspace");
    const parentPath = path.join(root, "ParentFlow.flyde");
    const flow = deserializeFlow(
      `imports:
  "./ChildFlow.flyde": ChildFlow
node:
  id: ParentFlow
  inputs: {}
  outputs: {}
  instances:
    - id: visual-child
      nodeId: ChildFlow
      inputConfig: {}
      pos:
        x: 0
        y: 0
  connections: []
  inputsPosition: {}
  outputsPosition: {}
`,
      parentPath
    );

    updateFlow(flow, parentPath, [
      {
        oldPath: path.join(root, "ChildFlow.flyde"),
        newPath: path.join(root, "nested", "ChildFlow.flyde"),
      },
    ]);

    assert.strictEqual(
      (flow.node.instances[0] as any).source.data,
      "./nested/ChildFlow.flyde"
    );
  });

  test("updates references to a flow moved as part of a folder move", () => {
    const root = path.resolve("workspace");
    const parentPath = path.join(root, "ParentFlow.flyde");
    const flow = createFlow([visualFileInstance("./old/ChildFlow.flyde")]);

    updateFlow(flow, parentPath, [
      {
        oldPath: path.join(root, "old"),
        newPath: path.join(root, "new"),
      },
    ]);

    assert.strictEqual(
      (flow.node.instances[0] as any).source.data,
      "./new/ChildFlow.flyde"
    );
  });

  test("keeps references unchanged when a moved folder contains both files", () => {
    const root = path.resolve("workspace");
    const flow = createFlow([visualFileInstance("./ChildFlow.flyde")]);

    const changed = updateFlowFileReferences(
      flow,
      path.join(root, "new", "ParentFlow.flyde"),
      [
        {
          oldPath: path.join(root, "old"),
          newPath: path.join(root, "new"),
        },
      ]
    );

    assert.strictEqual(changed, false);
    assert.strictEqual(
      (flow.node.instances[0] as any).source.data,
      "./ChildFlow.flyde"
    );
  });

  test("uses the most specific rename when nested renames overlap", () => {
    const root = path.resolve("workspace");
    const parentPath = path.join(root, "ParentFlow.flyde");
    const flow = createFlow([visualFileInstance("./old/ChildFlow.flyde")]);

    updateFlow(flow, parentPath, [
      {
        oldPath: path.join(root, "old"),
        newPath: path.join(root, "new"),
      },
      {
        oldPath: path.join(root, "old", "ChildFlow.flyde"),
        newPath: path.join(root, "special", "ChildFlow.flyde"),
      },
    ]);

    assert.strictEqual(
      (flow.node.instances[0] as any).source.data,
      "./special/ChildFlow.flyde"
    );
  });

  test("does not treat sibling folder prefixes as descendants", () => {
    const root = path.resolve("workspace");
    const parentPath = path.join(root, "ParentFlow.flyde");
    const flow = createFlow([visualFileInstance("./oldish/ChildFlow.flyde")]);

    const changed = updateFlowFileReferences(flow, parentPath, [
      {
        oldPath: path.join(root, "old"),
        newPath: path.join(root, "new"),
      },
    ]);

    assert.strictEqual(changed, false);
    assert.strictEqual(
      (flow.node.instances[0] as any).source.data,
      "./oldish/ChildFlow.flyde"
    );
  });
});
