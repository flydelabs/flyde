import assert from "node:assert/strict";
import * as path from "node:path";
import test from "node:test";
import {
  formatRelativeFlydeImport,
  resolveMovedTargetPath,
  updateFlowObjectImportsOnMove,
} from "./fileMoveImportUpdater.ts";

test("updates file source path when an imported code node is moved to a subfolder", () => {
  const workspace = path.resolve("/workspace/project");
  const flowPath = path.join(workspace, "Main.flyde");
  const oldNodePath = path.join(workspace, "MyCodeNode.flyde.ts");
  const newNodePath = path.join(workspace, "nodes", "MyCodeNode.flyde.ts");

  const flow = {
    node: {
      id: "Main",
      instances: [
        {
          id: "ins-1",
          nodeId: "MyCodeNode",
          type: "code",
          source: {
            type: "file",
            data: "MyCodeNode.flyde.ts",
          },
        },
      ],
    },
  };

  const changed = updateFlowObjectImportsOnMove(flow, flowPath, flowPath, [
    { oldPath: oldNodePath, newPath: newNodePath },
  ]);

  assert.equal(changed, true);
  assert.equal(flow.node.instances[0].source.data, "nodes/MyCodeNode.flyde.ts");
});

test("updates file source path when the importing .flyde flow itself is moved to another folder", () => {
  const workspace = path.resolve("/workspace/project");
  const oldFlowPath = path.join(workspace, "Main.flyde");
  const newFlowPath = path.join(workspace, "flows", "Main.flyde");

  const flow = {
    node: {
      id: "Main",
      instances: [
        {
          id: "ins-1",
          nodeId: "Helper",
          type: "code",
          source: {
            type: "file",
            data: "./Helper.flyde.ts",
          },
        },
      ],
    },
  };

  const changed = updateFlowObjectImportsOnMove(flow, oldFlowPath, newFlowPath, [
    { oldPath: oldFlowPath, newPath: newFlowPath },
  ]);

  assert.equal(changed, true);
  assert.equal(flow.node.instances[0].source.data, "../Helper.flyde.ts");
});

test("updates nested inline visual node imports and legacy imports map when a directory is renamed", () => {
  const workspace = path.resolve("/workspace/project");
  const flowPath = path.join(workspace, "Main.flyde");
  const oldDir = path.join(workspace, "old-folder");
  const newDir = path.join(workspace, "new-folder");

  const flow = {
    imports: {
      "./old-folder/Legacy.flyde.ts": ["Legacy"],
      "@flyde/nodes": ["InlineValue"],
    },
    node: {
      id: "Main",
      instances: [
        {
          id: "inline-1",
          type: "visual",
          source: {
            type: "inline",
            data: {
              id: "InlineSub",
              instances: [
                {
                  id: "sub-1",
                  nodeId: "SubFlow",
                  type: "visual",
                  source: {
                    type: "file",
                    data: "./old-folder/SubFlow.flyde",
                  },
                },
              ],
            },
          },
        },
      ],
    },
  };

  const changed = updateFlowObjectImportsOnMove(flow, flowPath, flowPath, [
    { oldPath: oldDir, newPath: newDir },
  ]);

  assert.equal(changed, true);
  assert.equal(
    flow.node.instances[0].source.data.instances[0].source.data,
    "./new-folder/SubFlow.flyde"
  );
  assert.deepEqual(flow.imports, {
    "./new-folder/Legacy.flyde.ts": ["Legacy"],
    "@flyde/nodes": ["InlineValue"],
  });
});

test("resolveMovedTargetPath and formatRelativeFlydeImport preserve unchanged paths", () => {
  const workspace = path.resolve("/workspace/project");
  const target = path.join(workspace, "Unchanged.flyde.ts");
  assert.equal(
    resolveMovedTargetPath(target, [
      {
        oldPath: path.join(workspace, "Other.flyde.ts"),
        newPath: path.join(workspace, "sub", "Other.flyde.ts"),
      },
    ]),
    target
  );
  assert.equal(
    formatRelativeFlydeImport(workspace, target, "./Unchanged.flyde.ts"),
    "./Unchanged.flyde.ts"
  );
});
