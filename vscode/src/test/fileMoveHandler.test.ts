import * as assert from "assert";
import * as path from "path";
import { suite, test } from "mocha";
import { computeUpdatedImports } from "../fileMoveHandler";

suite("File Move Handler Test Suite", () => {
  test("updates relative import when imported .flyde file is moved", () => {
    const flowPath = path.resolve("/workspace/src/Main.flyde");
    const flowContent = `imports:
  ./sub/Helper.flyde:
    - HelperNode
node:
  id: Main
  instances: []
  connections: []
`;

    const renames = [
      {
        oldPath: path.resolve("/workspace/src/sub/Helper.flyde"),
        newPath: path.resolve("/workspace/src/utils/Helper.flyde"),
      },
    ];

    const result = computeUpdatedImports(flowContent, flowPath, renames);
    assert.notStrictEqual(result, null, "Should return updated content");
    assert.ok(
      result!.includes("./utils/Helper.flyde"),
      `Expected ./utils/Helper.flyde in result, got:\n${result}`
    );
    assert.ok(
      !result!.includes("./sub/Helper.flyde"),
      "Old path should no longer be present"
    );
  });

  test("updates relative import when imported code node (.flyde.ts) is moved", () => {
    const flowPath = path.resolve("/workspace/src/Main.flyde");
    const flowContent = `imports:
  ./nodes/Add.flyde.ts:
    - AddNode
node:
  id: Main
`;

    const renames = [
      {
        oldPath: path.resolve("/workspace/src/nodes/Add.flyde.ts"),
        newPath: path.resolve("/workspace/src/shared/math/Add.flyde.ts"),
      },
    ];

    const result = computeUpdatedImports(flowContent, flowPath, renames);
    assert.notStrictEqual(result, null);
    assert.ok(result!.includes("./shared/math/Add.flyde.ts"));
  });

  test("updates relative imports when directory is moved or renamed", () => {
    const flowPath = path.resolve("/workspace/src/Main.flyde");
    const flowContent = `imports:
  ./components/Button.flyde:
    - Button
node:
  id: Main
`;

    const renames = [
      {
        oldPath: path.resolve("/workspace/src/components"),
        newPath: path.resolve("/workspace/src/ui/components"),
      },
    ];

    const result = computeUpdatedImports(flowContent, flowPath, renames);
    assert.notStrictEqual(result, null);
    assert.ok(result!.includes("./ui/components/Button.flyde"));
  });

  test("updates imports when the .flyde file itself is moved to a new folder", () => {
    const oldFlowPath = path.resolve("/workspace/src/Main.flyde");
    const newFlowPath = path.resolve("/workspace/src/flows/Main.flyde");
    const flowContent = `imports:
  ./Helper.flyde:
    - HelperNode
node:
  id: Main
`;

    const renames = [
      {
        oldPath: oldFlowPath,
        newPath: newFlowPath,
      },
    ];

    const result = computeUpdatedImports(flowContent, oldFlowPath, renames);
    assert.notStrictEqual(result, null);
    // Relative to /workspace/src/flows/, Helper.flyde at /workspace/src/Helper.flyde is ../Helper.flyde
    assert.ok(
      result!.includes("../Helper.flyde"),
      `Expected ../Helper.flyde in result, got:\n${result}`
    );
  });

  test("returns null when no imports are affected", () => {
    const flowPath = path.resolve("/workspace/src/Main.flyde");
    const flowContent = `imports:
  ./sub/Helper.flyde:
    - HelperNode
node:
  id: Main
`;

    const renames = [
      {
        oldPath: path.resolve("/workspace/src/unrelated/Other.flyde"),
        newPath: path.resolve("/workspace/src/unrelated2/Other.flyde"),
      },
    ];

    const result = computeUpdatedImports(flowContent, flowPath, renames);
    assert.strictEqual(result, null);
  });
});
