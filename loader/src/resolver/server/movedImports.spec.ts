import { CodeNode } from "@flyde/core";
import { assert } from "chai";
import { mkdirSync, mkdtempSync, renameSync, rmSync, writeFileSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";
import { createServerReferencedNodeFinder } from "./findReferencedNodeServer";
import { resolveFlowByPath } from "./resolveFlowServer";

const CODE_NODE_FILE = `
module.exports = {
  id: "Add",
  inputs: {
    a: { mode: "required", type: "number" },
  },
  outputs: { r: "number" },
  run: (inputs, outputs) => {
    outputs.r.next(inputs.a + 1);
  },
};
`;

const SUBFLOW_FILE = `
node:
  id: SubFlow
  instances: []
  connections: []
  inputs: {}
  outputs: {}
`;

const flowImportingCodeNode = (data: string) => `
node:
  id: AddOne
  instances:
    - pos:
        x: 0
        y: 0
      id: ins1
      inputConfig: {}
      nodeId: Add
      type: code
      source:
        type: file
        data: ${data}
  connections: []
  inputs: {}
  outputs: {}
`;

const flowImportingVisualNode = (data: string) => `
node:
  id: Container
  instances:
    - pos:
        x: 0
        y: 0
      id: ins1
      inputConfig: {}
      nodeId: SubFlow
      type: visual
      source:
        type: file
        data: ${data}
  connections: []
  inputs: {}
  outputs: {}
`;

describe("resolving imports after files are moved (#112)", () => {
  let root: string;

  beforeEach(() => {
    root = mkdtempSync(join(tmpdir(), "flyde-moved-imports-"));
    // find-root uses package.json as the project root marker
    writeFileSync(join(root, "package.json"), "{}");
  });

  afterEach(() => {
    rmSync(root, { recursive: true, force: true });
  });

  it("resolves a code node file that was moved to another folder", () => {
    const folderA = join(root, "folderA");
    mkdirSync(folderA);
    const flowPath = join(folderA, "a.flyde");
    writeFileSync(flowPath, flowImportingCodeNode("./Add.flyde.js"));
    writeFileSync(join(folderA, "Add.flyde.js"), CODE_NODE_FILE);

    // sanity check before the move
    assert.match((resolveFlowByPath(flowPath).instances[0] as any).node.id, /^Add/);

    const folderB = join(root, "folderB");
    mkdirSync(folderB);
    renameSync(join(folderA, "Add.flyde.js"), join(folderB, "Add.flyde.js"));

    const resolved = resolveFlowByPath(flowPath);
    assert.match((resolved.instances[0] as any).node.id, /^Add/); // processed code nodes are instance-qualified (Add__ins1)
  });

  it("resolves a visual subflow that was moved to another folder", () => {
    const folderA = join(root, "folderA");
    mkdirSync(folderA);
    const flowPath = join(folderA, "a.flyde");
    writeFileSync(flowPath, flowImportingVisualNode("./b.flyde"));
    writeFileSync(join(folderA, "b.flyde"), SUBFLOW_FILE);

    const folderB = join(root, "folderB");
    mkdirSync(folderB);
    renameSync(join(folderA, "b.flyde"), join(folderB, "b.flyde"));

    const resolved = resolveFlowByPath(flowPath);
    assert.equal((resolved.instances[0] as any).node.id, "SubFlow");
  });

  it("resolves the import when the importing flow itself was moved", () => {
    const folderA = join(root, "folderA");
    mkdirSync(folderA);
    writeFileSync(join(folderA, "a.flyde"), flowImportingCodeNode("./Add.flyde.js"));
    writeFileSync(join(folderA, "Add.flyde.js"), CODE_NODE_FILE);

    const folderB = join(root, "folderB");
    mkdirSync(folderB);
    renameSync(join(folderA, "a.flyde"), join(folderB, "a.flyde"));

    const resolved = resolveFlowByPath(join(folderB, "a.flyde"));
    assert.match((resolved.instances[0] as any).node.id, /^Add/); // processed code nodes are instance-qualified (Add__ins1)
  });

  it("resolves relative imports declared under the package source type after a move", () => {
    const folderA = join(root, "folderA");
    mkdirSync(folderA);
    const flowPath = join(folderA, "a.flyde");
    writeFileSync(flowPath, flowImportingCodeNode("./Add.flyde.js"));
    writeFileSync(join(folderA, "Add.flyde.js"), CODE_NODE_FILE);

    const folderB = join(root, "folderB");
    mkdirSync(folderB);
    renameSync(join(folderA, "Add.flyde.js"), join(folderB, "Add.flyde.js"));

    const finder = createServerReferencedNodeFinder(flowPath);
    const codeInstance = {
      id: "ins1",
      type: "code" as const,
      nodeId: "Add",
      source: { type: "package" as const, data: "./Add.flyde.js" },
      inputConfig: {},
      config: {},
      pos: { x: 0, y: 0 },
    };

    const node = finder(codeInstance) as CodeNode;
    assert.equal(node.id, "Add");
  });

  it("still throws a clear error when the imported file is genuinely missing", () => {
    const folderA = join(root, "folderA");
    mkdirSync(folderA);
    const flowPath = join(folderA, "a.flyde");
    writeFileSync(flowPath, flowImportingCodeNode("./Nope.flyde.js"));

    assert.throws(() => resolveFlowByPath(flowPath), /Cannot find node Add/);
  });
});
