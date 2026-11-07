import { assert } from "chai";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";
import { runFlow } from "../../run-flow";
import { deserializeFlowByPath } from "../../serdes";
import { resolveFlowByPath } from "./resolveFlowServer";
import {
  resolveMovedFilePath,
  rewriteFlowImportsAfterMove,
  validateAndRecoverFlowImports,
} from "./resolveMovedFileImport";

interface TempWorkspace {
  rootDir: string;
  writeText: (relPath: string, content: string) => string;
  cleanup: () => void;
}

interface MovedFlowScenario {
  dependencyRelPath: string;
  flowRelPath: string;
  storedImportPath: string;
  inputValue: number;
}

const ADD_ONE_CODE_NODE = `
module.exports = {
  id: "AddOne",
  inputs: { n: { mode: "required" } },
  outputs: { r: {} },
  run: ({ n }, { r }) => r.next(n + 1),
};
`;

function createFlowYaml(importPath: string, nodeId = "AddOne"): string {
  return `imports: {}
node:
  id: TestFlow
  inputs:
    n:
      mode: required
      type: number
  outputs:
    r:
      type: number
  instances:
    - id: ins1
      nodeId: ${nodeId}
      type: code
      inputConfig: {}
      pos:
        x: 0
        y: 0
      source:
        type: file
        data: "${importPath}"
  connections:
    - from:
        insId: __this
        pinId: n
      to:
        insId: ins1
        pinId: n
    - from:
        insId: ins1
        pinId: r
      to:
        insId: __this
        pinId: r
  inputsPosition: {}
  outputsPosition: {}
`;
}

function createTempWorkspace(): TempWorkspace {
  const rootDir = mkdtempSync(join(tmpdir(), "flyde-move-spec-"));
  writeFileSync(join(rootDir, "package.json"), JSON.stringify({ name: "tmp" }));

  const writeText = (relPath: string, content: string): string => {
    const fullPath = join(rootDir, relPath);
    const parentDir = join(fullPath, "..");
    mkdirSync(parentDir, { recursive: true });
    writeFileSync(fullPath, content, "utf8");
    return fullPath;
  };

  const cleanup = () => {
    rmSync(rootDir, { recursive: true, force: true });
  };

  return { rootDir, writeText, cleanup };
}

async function executeMovedFlowScenario(
  scenario: MovedFlowScenario
): Promise<number> {
  const ws = createTempWorkspace();
  try {
    ws.writeText(scenario.dependencyRelPath, ADD_ONE_CODE_NODE);
    ws.writeText(
      scenario.flowRelPath,
      createFlowYaml(scenario.storedImportPath)
    );
    const output = await runFlow(
      scenario.flowRelPath,
      { n: scenario.inputValue },
      { root: ws.rootDir, debuggerUrl: undefined }
    );
    return output.r;
  } finally {
    ws.cleanup();
  }
}

describe("resolveMovedFileImport", () => {
  it("recovers when flow and its dependency are moved together with a stale relative prefix", async () => {
    const result = await executeMovedFlowScenario({
      dependencyRelPath: "relocated/AddOne.flyde.js",
      flowRelPath: "relocated/main.flyde",
      storedImportPath: "../old-dir/AddOne.flyde.js",
      inputValue: 10,
    });
    assert.equal(result, 11);
  });

  it("recovers when a .flyde file is moved down into a nested directory", async () => {
    const result = await executeMovedFlowScenario({
      dependencyRelPath: "flows/AddOne.flyde.js",
      flowRelPath: "flows/nested/deeper/main.flyde",
      storedImportPath: "./AddOne.flyde.js",
      inputValue: 20,
    });
    assert.equal(result, 21);
  });

  it("recovers when a .flyde file is moved up the directory hierarchy", async () => {
    const result = await executeMovedFlowScenario({
      dependencyRelPath: "nodes/AddOne.flyde.js",
      flowRelPath: "flows/main.flyde",
      storedImportPath: "../../../nodes/AddOne.flyde.js",
      inputValue: 30,
    });
    assert.equal(result, 31);
  });

  it("recovers when an imported dependency is moved to a different folder in the workspace", async () => {
    const ws = createTempWorkspace();
    try {
      const movedDepPath = ws.writeText(
        "shared/utils/AddOne.flyde.js",
        ADD_ONE_CODE_NODE
      );
      const flowPath = ws.writeText(
        "flows/main.flyde",
        createFlowYaml("./AddOne.flyde.js")
      );

      const resolved = resolveMovedFilePath({
        fullFlowPath: flowPath,
        importPath: "./AddOne.flyde.js",
        nodeId: "AddOne",
        searchRoot: ws.rootDir,
      });
      assert.equal(resolved, movedDepPath);
    } finally {
      ws.cleanup();
    }
  });

  it("validates imports before execution and throws on unrecoverable missing files", () => {
    const ws = createTempWorkspace();
    try {
      const flowPath = ws.writeText(
        "flows/broken.flyde",
        createFlowYaml("./NonExistentNode.flyde.js", "MissingNode")
      );
      const flow = deserializeFlowByPath(flowPath);

      assert.throws(() => {
        validateAndRecoverFlowImports(flow, {
          fullFlowPath: flowPath,
          searchRoot: ws.rootDir,
        });
      }, /Cannot find imported file/);
    } finally {
      ws.cleanup();
    }
  });

  it("rebases transitive imports when resolving a visual node from a subfolder", async () => {
    const ws = createTempWorkspace();
    try {
      ws.writeText("flows/sub/AddOne.flyde.js", ADD_ONE_CODE_NODE);
      ws.writeText(
        "flows/sub/Child.flyde",
        createFlowYaml("./AddOne.flyde.js").replace("id: TestFlow", "id: Child")
      );
      const parentFlowYaml = createFlowYaml("./sub/Child.flyde", "Child").replace(
        "type: code",
        "type: visual"
      );
      const parentPath = ws.writeText("flows/Parent.flyde", parentFlowYaml);

      const resolvedNode = resolveFlowByPath(parentPath);
      assert.equal(resolvedNode.id, "TestFlow");

      const output = await runFlow(
        "flows/Parent.flyde",
        { n: 7 },
        { root: ws.rootDir, debuggerUrl: undefined }
      );
      assert.equal(output.r, 8);
    } finally {
      ws.cleanup();
    }
  });

  it("rewrites relative import paths when imported targets or flows are moved", () => {
    const rawYaml = createFlowYaml("./ChildFlow.flyde", "ChildFlow");

    const afterTargetMove = rewriteFlowImportsAfterMove(rawYaml, {
      currentFlowPath: "/workspace/flows/ParentFlow.flyde",
      renamedEntries: [
        {
          oldPath: "/workspace/flows/ChildFlow.flyde",
          newPath: "/workspace/shared/ChildFlow.flyde",
        },
      ],
    });
    assert.isTrue(afterTargetMove.changed);
    assert.include(afterTargetMove.content, "../shared/ChildFlow.flyde");

    const afterFlowMove = rewriteFlowImportsAfterMove(rawYaml, {
      currentFlowPath: "/workspace/flows/nested/ParentFlow.flyde",
      renamedEntries: [
        {
          oldPath: "/workspace/flows/ParentFlow.flyde",
          newPath: "/workspace/flows/nested/ParentFlow.flyde",
        },
      ],
    });
    assert.isTrue(afterFlowMove.changed);
    assert.include(afterFlowMove.content, "../ChildFlow.flyde");
  });
});
