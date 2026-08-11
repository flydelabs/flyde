import assert = require("assert");
import * as path from "path";
import { FlydeFlow } from "@flyde/core";
import { updateFileReferencesOnRename } from "./update-file-references-on-rename";

describe("updateFileReferencesOnRename", () => {
  it("updates a local reference when its source file is moved", () => {
    const flow: FlydeFlow = {
      imports: {},
      node: {
        id: "Consumer",
        inputs: {},
        inputsPosition: {},
        outputs: {},
        outputsPosition: {},
        instances: [
          {
            id: "producer",
            type: "visual",
            nodeId: "Producer",
            source: { type: "file", data: "./Producer.flyde" },
            inputConfig: {},
            pos: { x: 0, y: 0 },
          },
        ],
        connections: [],
      },
    };
    const workspace = path.resolve("workspace");
    const consumerPath = path.join(workspace, "flows", "Consumer.flyde");
    const oldProducerPath = path.join(workspace, "flows", "Producer.flyde");
    const newProducerPath = path.join(workspace, "shared", "Producer.flyde");

    const changed = updateFileReferencesOnRename(
      flow,
      consumerPath,
      [{
        oldPath: oldProducerPath,
        newPath: newProducerPath,
      }]
    );

    assert.strictEqual(changed, true);
    const source = flow.node.instances[0].source;
    assert.strictEqual(source.type, "file");
    assert.strictEqual(source.data, path.relative(path.dirname(consumerPath), newProducerPath));
  });

  it("does not change package references", () => {
    const flow: FlydeFlow = {
      imports: {},
      node: {
        id: "Consumer",
        inputs: {},
        inputsPosition: {},
        outputs: {},
        outputsPosition: {},
        instances: [
          {
            id: "node",
            type: "code",
            nodeId: "Add",
            source: { type: "package", data: "@flyde/nodes" },
            config: {},
            inputConfig: {},
            pos: { x: 0, y: 0 },
          },
        ],
        connections: [],
      },
    };

    const changed = updateFileReferencesOnRename(flow, "/workspace/Consumer.flyde", [
      { oldPath: "/workspace/Producer.flyde", newPath: "/workspace/Other.flyde" },
    ]);

    assert.strictEqual(changed, false);
  });
});
