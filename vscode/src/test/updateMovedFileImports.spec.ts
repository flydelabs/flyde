import * as assert from "assert";
import { updateFlowContentOnFileRename } from "../updateMovedFileImports";

// Case 1: Moving an imported `.flyde.ts` file into a subdirectory
{
  const flowBefore = [
    "imports: {}",
    "node:",
    "  instances:",
    "    - id: helper-1",
    "      nodeId: MyHelper",
    "      type: code",
    "      source:",
    "        type: file",
    '        data: "./helper.flyde.ts"',
  ].join("\n");

  const res = updateFlowContentOnFileRename(
    flowBefore,
    "/workspace/src/main.flyde",
    "/workspace/src/main.flyde",
    [{ oldFsPath: "/workspace/src/helper.flyde.ts", newFsPath: "/workspace/src/nodes/helper.flyde.ts" }]
  );

  assert.strictEqual(res.changed, true);
  assert.ok(res.content.includes('data: "./nodes/helper.flyde.ts"'));
}

// Case 2: Moving a directory containing imported node files
{
  const flowBefore = [
    "imports: {}",
    "node:",
    "  instances:",
    "    - id: lib-a",
    "      nodeId: NodeA",
    "      type: code",
    "      source:",
    "        data: ./lib/a.flyde.ts",
    "        type: file",
  ].join("\n");

  const res = updateFlowContentOnFileRename(
    flowBefore,
    "/workspace/flows/app.flyde",
    "/workspace/flows/app.flyde",
    [{ oldFsPath: "/workspace/flows/lib", newFsPath: "/workspace/flows/shared/lib" }]
  );

  assert.strictEqual(res.changed, true);
  assert.ok(res.content.includes("data: ./shared/lib/a.flyde.ts"));
}

// Case 3: Moving the `.flyde` flow file itself into a subdirectory
{
  const flowBefore = [
    "imports: {}",
    "node:",
    "  instances:",
    "    - id: helper-1",
    "      nodeId: MyHelper",
    "      type: code",
    "      source:",
    "        type: file",
    '        data: "./helper.flyde.ts"',
  ].join("\n");

  const res = updateFlowContentOnFileRename(
    flowBefore,
    "/workspace/src/main.flyde",
    "/workspace/src/nested/main.flyde",
    [{ oldFsPath: "/workspace/src/main.flyde", newFsPath: "/workspace/src/nested/main.flyde" }]
  );

  assert.strictEqual(res.changed, true);
  assert.ok(res.content.includes('data: "../helper.flyde.ts"'));
}

// Case 4: Updating nested `inline` visual nodes and legacy top-level `imports:` map
{
  const flowBefore = [
    "imports:",
    '  "./sub/OldFlow.flyde":',
    "    - OldFlow",
    "node:",
    "  instances:",
    "    - id: wrapper-inline",
    "      type: visual",
    "      source:",
    "        type: inline",
    "        data:",
    "          instances:",
    "            - id: inner-file-node",
    "              type: visual",
    "              source:",
    "                type: file",
    '                data: "./sub/OldFlow.flyde"',
  ].join("\n");

  const res = updateFlowContentOnFileRename(
    flowBefore,
    "/repo/main.flyde",
    "/repo/main.flyde",
    [{ oldFsPath: "/repo/sub/OldFlow.flyde", newFsPath: "/repo/components/NewFlow.flyde" }]
  );

  assert.strictEqual(res.changed, true);
  assert.ok(res.content.includes('  "./components/NewFlow.flyde":'));
  assert.ok(res.content.includes('data: "./components/NewFlow.flyde"'));
}

// Case 5: Windows paths (backslashes + drive letters) still emit POSIX `/` imports
{
  const flowBefore = [
    "imports: {}",
    "node:",
    "  instances:",
    "    - id: win-node",
    "      type: code",
    "      source:",
    "        type: file",
    '        data: "./utils/calc.flyde.ts"',
  ].join("\r\n");

  const res = updateFlowContentOnFileRename(
    flowBefore,
    "C:\\workspace\\flows\\main.flyde",
    "C:\\workspace\\flows\\sub\\main.flyde",
    [{ oldFsPath: "C:\\workspace\\flows\\main.flyde", newFsPath: "C:\\workspace\\flows\\sub\\main.flyde" }]
  );

  assert.strictEqual(res.changed, true);
  assert.ok(res.content.includes('data: "../utils/calc.flyde.ts"'));
  assert.ok(!res.content.includes("\\"), "Expected POSIX forward slashes in import path");
}

console.log("[PASS] All 5 updateMovedFileImports test cases passed!");
