import * as assert from "assert";
import * as path from "path";
import { updateFlowImportsAfterRename } from "../updateFlowImportsAfterRename";
import { FlydeFlow } from "@flyde/core";

suite("updateFlowImportsAfterRename", () => {
  test("updates file source paths relative to the flow file", () => {
    const flowPath = path.join("project", "flows", "parent.flyde");
    const oldPath = path.join("project", "flows", "child.flyde");
    const newPath = path.join("project", "shared", "child.flyde");
    const flow: FlydeFlow = {
      node: {
        id: "Parent",
        inputs: {},
        outputs: {},
        instances: [
          {
            id: "child",
            nodeId: "Child",
            inputConfig: {},
            source: {
              type: "file",
              data: "./child.flyde",
            },
            pos: { x: 0, y: 0 },
            type: "visual",
          },
        ],
        connections: [],
        inputsPosition: {},
        outputsPosition: {},
      },
    };

    const didUpdate = updateFlowImportsAfterRename(
      flow,
      flowPath,
      oldPath,
      newPath
    );

    assert.strictEqual(didUpdate, true);
    assert.strictEqual(
      flow.node.instances[0].source?.type === "file" &&
      flow.node.instances[0].source.data,
      "../shared/child.flyde"
    );
  });

  test("updates nested inline flow references", () => {
    const flowPath = path.join("project", "flows", "parent.flyde");
    const oldPath = path.join("project", "flows", "child.flyde.ts");
    const newPath = path.join("project", "flows", "nodes", "child.flyde.ts");
    const flow: FlydeFlow = {
      node: {
        id: "Parent",
        inputs: {},
        outputs: {},
        instances: [
          {
            id: "inline",
            nodeId: "Inline",
            inputConfig: {},
            source: {
              type: "inline",
              data: {
                id: "Inline",
                inputs: {},
                outputs: {},
                instances: [
                  {
                    id: "child",
                    nodeId: "Child",
                    inputConfig: {},
                    source: {
                      type: "file",
                      data: "./child.flyde.ts",
                    },
                    config: {},
                    pos: { x: 0, y: 0 },
                    type: "code",
                  },
                ],
                connections: [],
                inputsPosition: {},
                outputsPosition: {},
              },
            },
            pos: { x: 0, y: 0 },
            type: "visual",
          },
        ],
        connections: [],
        inputsPosition: {},
        outputsPosition: {},
      },
    };

    const didUpdate = updateFlowImportsAfterRename(
      flow,
      flowPath,
      oldPath,
      newPath
    );
    const inlineSource = flow.node.instances[0].source;

    assert.strictEqual(didUpdate, true);
    assert.strictEqual(
      inlineSource?.type === "inline" &&
      inlineSource.data.instances[0].source?.type === "file" &&
      inlineSource.data.instances[0].source.data,
      "./nodes/child.flyde.ts"
    );
  });

  test("updates references when a containing directory is moved", () => {
    const flowPath = path.join("project", "flows", "parent.flyde");
    const oldPath = path.join("project", "flows");
    const newPath = path.join("project", "shared", "flows");
    const flow: FlydeFlow = {
      node: {
        id: "Parent",
        inputs: {},
        outputs: {},
        instances: [
          {
            id: "child",
            nodeId: "Child",
            inputConfig: {},
            source: {
              type: "file",
              data: "./nested/child.flyde",
            },
            pos: { x: 0, y: 0 },
            type: "visual",
          },
        ],
        connections: [],
        inputsPosition: {},
        outputsPosition: {},
      },
    };

    const didUpdate = updateFlowImportsAfterRename(
      flow,
      flowPath,
      oldPath,
      newPath
    );

    assert.strictEqual(didUpdate, true);
    assert.strictEqual(
      flow.node.instances[0].source?.type === "file" &&
      flow.node.instances[0].source.data,
      "../shared/flows/nested/child.flyde"
    );
  });
});
