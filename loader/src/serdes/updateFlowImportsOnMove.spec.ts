import { assert } from "chai";
import {
  rewriteRelativeImportPath,
  updateFlowImportsOnMove,
} from "./updateFlowImportsOnMove";

describe("updateFlowImportsOnMove (#112)", () => {
  it("rewrites relative import path when an imported node file is moved to another folder", () => {
    const rewritten = rewriteRelativeImportPath(
      "/workspace/src/flows/Main.flyde",
      "/workspace/src/flows/Main.flyde",
      "./Add.flyde.ts",
      [
        {
          oldPath: "/workspace/src/flows/Add.flyde.ts",
          newPath: "/workspace/src/nodes/math/Add.flyde.ts",
        },
      ]
    );
    assert.strictEqual(rewritten, "../nodes/math/Add.flyde.ts");
  });

  it("rewrites relative imports when the .flyde flow file itself is moved", () => {
    const rewritten = rewriteRelativeImportPath(
      "/workspace/src/Main.flyde",
      "/workspace/src/nested/flows/Main.flyde",
      "./helpers/Sub.flyde.ts",
      [
        {
          oldPath: "/workspace/src/Main.flyde",
          newPath: "/workspace/src/nested/flows/Main.flyde",
        },
      ]
    );
    assert.strictEqual(rewritten, "../../helpers/Sub.flyde.ts");
  });

  it("updates both legacy imports and node.instances[].source.data in .flyde YAML", () => {
    const sampleFlow = `imports:
  "./b.flyde": AddOne
node:
  id: TestFlow
  inputs: {}
  outputs: {}
  instances:
    - id: inst1
      nodeId: AddOne
      source:
        type: file
        data: "./b.flyde"
      inputConfig: {}
      pos:
        x: 10
        y: 20
  connections: []
`;
    const res = updateFlowImportsOnMove(
      sampleFlow,
      "/workspace/flows/a.flyde",
      "/workspace/flows/a.flyde",
      [
        {
          oldPath: "/workspace/flows/b.flyde",
          newPath: "/workspace/flows/sub/b.flyde",
        },
      ]
    );
    assert.isTrue(res.updated);
    assert.include(res.content, "./sub/b.flyde");
  });
});
