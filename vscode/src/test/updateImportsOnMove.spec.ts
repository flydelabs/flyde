import assert = require("assert");
import {
  computeUpdatedRelativeImport,
  updateFlowObjectImports,
} from "../updateImportsOnMove";

suite("updateImportsOnMove Test Suite", () => {
  test("updates file-sourced instance when an imported node file is moved", () => {
    const flow = {
      imports: {},
      node: {
        id: "MainFlow",
        instances: [
          {
            id: "ins1",
            nodeId: "Add",
            type: "code",
            source: {
              type: "file",
              data: "./Add.flyde.ts",
            },
          },
        ],
      },
    };

    const changed = updateFlowObjectImports(flow, "/workspace/flows/MainFlow.flyde", [
      {
        oldPath: "/workspace/flows/Add.flyde.ts",
        newPath: "/workspace/flows/sub/Add.flyde.ts",
      },
    ]);

    assert.strictEqual(changed, true);
    assert.strictEqual(flow.node.instances[0].source.data, "./sub/Add.flyde.ts");
  });

  test("updates relative file imports when the flow file itself is moved", () => {
    const flow = {
      imports: {},
      node: {
        id: "MainFlow",
        instances: [
          {
            id: "ins1",
            nodeId: "ChildFlow",
            type: "visual",
            source: {
              type: "file",
              data: "./ChildFlow.flyde",
            },
          },
          {
            id: "ins2",
            nodeId: "InlineValue",
            type: "code",
            source: {
              type: "package",
              data: "@flyde/nodes",
            },
          },
        ],
      },
    };

    const changed = updateFlowObjectImports(
      flow,
      "/workspace/flows/nested/MainFlow.flyde",
      [
        {
          oldPath: "/workspace/flows/MainFlow.flyde",
          newPath: "/workspace/flows/nested/MainFlow.flyde",
        },
      ]
    );

    assert.strictEqual(changed, true);
    assert.strictEqual(flow.node.instances[0].source.data, "../ChildFlow.flyde");
    assert.strictEqual(flow.node.instances[1].source.data, "@flyde/nodes");
  });

  test("computes updated relative import across directory moves", () => {
    const updated = computeUpdatedRelativeImport(
      "./shared/Helper.flyde.js",
      "/workspace/flows/MainFlow.flyde",
      "/workspace/flows/MainFlow.flyde",
      [
        {
          oldPath: "/workspace/flows/shared",
          newPath: "/workspace/common",
        },
      ]
    );

    assert.strictEqual(updated, "../common/Helper.flyde.js");
  });
});
