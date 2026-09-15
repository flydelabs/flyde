import assert = require("assert");
import { updateFlowImportForRename } from "./flow-imports";

const flow = (data: string) => ({
  node: {
    id: "Parent",
    inputs: {},
    outputs: {},
    instances: [
      {
        id: "child",
        nodeId: "Child",
        type: "visual",
        source: { type: "file", data },
        inputConfig: {},
        pos: { x: 0, y: 0 },
      },
    ],
    connections: [],
  },
  imports: {},
});

describe("flow import rename handling", () => {
  it("updates a relative import when its target moves", () => {
    const value = flow("./ChildFlow.flyde");
    const changed = updateFlowImportForRename(
      value as any,
      "/workspace/flows/Parent.flyde",
      "/workspace/flows/ChildFlow.flyde",
      "/workspace/components/ChildFlow.flyde",
    );

    assert.equal(changed, true);
    assert.equal(value.node.instances[0].source.data, "../components/ChildFlow.flyde");
  });

  it("does not rewrite imports that point elsewhere", () => {
    const value = flow("./OtherFlow.flyde");
    const changed = updateFlowImportForRename(
      value as any,
      "/workspace/flows/Parent.flyde",
      "/workspace/flows/ChildFlow.flyde",
      "/workspace/components/ChildFlow.flyde",
    );

    assert.equal(changed, false);
    assert.equal(value.node.instances[0].source.data, "./OtherFlow.flyde");
  });
});
