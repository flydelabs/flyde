import { dynamicNodeInput, execute } from "@flyde/core";
import { spiedOutput } from "@flyde/core/dist/test-utils";
import { assert } from "chai";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";
import { deserializeFlow } from "../serdes";
import { resolveEditorNode } from "./resolveEditorNode";
import { createServerReferencedNodeFinder } from "./server/findReferencedNodeServer";
import { updateFlowImportsForMovedFiles } from "./server/movedFileImports";
import { resolveFlowByPath } from "./server/resolveFlowServer";

describe("moved file imports", () => {
  let tempRoot: string;

  beforeEach(() => {
    tempRoot = mkdtempSync(join(tmpdir(), "flyde-moved-imports-"));
    writeFileSync(
      join(tempRoot, "package.json"),
      JSON.stringify({ name: "flyde-moved-test", version: "1.0.0" })
    );
  });

  afterEach(() => {
    rmSync(tempRoot, { recursive: true, force: true });
  });

  it("resolves and executes a flow after an imported code node file is moved to a subfolder", () => {
    const subDir = join(tempRoot, "nodes", "math");
    mkdirSync(subDir, { recursive: true });

    writeFileSync(
      join(subDir, "AddOne.flyde.js"),
      `module.exports = {
        id: "AddOne",
        inputs: { n: { mode: "required", type: "number" } },
        outputs: { r: { type: "number" } },
        run: (inputs, outputs) => outputs.r.next(inputs.n + 1)
      };`
    );

    const flowPath = join(tempRoot, "Main.flyde");
    writeFileSync(
      flowPath,
      `imports: {}
node:
  id: Main
  inputs:
    n:
      mode: required
      type: number
  outputs:
    r:
      type: number
  instances:
    - id: ins1
      nodeId: AddOne
      type: code
      source:
        type: file
        data: ./AddOne.flyde.js
      config: {}
      inputConfig: {}
      pos:
        x: 0
        y: 0
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
`
    );

    const resolved = resolveFlowByPath(flowPath);
    const [spy, r] = spiedOutput();
    const n = dynamicNodeInput();

    execute({
      node: resolved,
      inputs: { n },
      outputs: { r },
    });

    n.subject.next(10);
    assert.equal(spy.lastCall.args[0], 11);
  });

  it("resolves and executes a flow after the flow file itself is moved into a subfolder", () => {
    writeFileSync(
      join(tempRoot, "MultiplyTwo.flyde.js"),
      `module.exports = {
        id: "MultiplyTwo",
        inputs: { n: { mode: "required", type: "number" } },
        outputs: { r: { type: "number" } },
        run: (inputs, outputs) => outputs.r.next(inputs.n * 2)
      };`
    );

    const movedFlowsDir = join(tempRoot, "flows", "nested");
    mkdirSync(movedFlowsDir, { recursive: true });
    const flowPath = join(movedFlowsDir, "MovedFlow.flyde");

    writeFileSync(
      flowPath,
      `imports: {}
node:
  id: MovedFlow
  inputs:
    n:
      mode: required
      type: number
  outputs:
    r:
      type: number
  instances:
    - id: ins1
      nodeId: MultiplyTwo
      type: code
      source:
        type: file
        data: ./MultiplyTwo.flyde.js
      config: {}
      inputConfig: {}
      pos:
        x: 0
        y: 0
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
`
    );

    const resolved = resolveFlowByPath(flowPath);
    const [spy, r] = spiedOutput();
    const n = dynamicNodeInput();

    execute({
      node: resolved,
      inputs: { n },
      outputs: { r },
    });

    n.subject.next(7);
    assert.equal(spy.lastCall.args[0], 14);
  });

  it("resolves transitive dependencies when a visual subflow and its code node are in another folder", () => {
    const subDir = join(tempRoot, "subflows");
    mkdirSync(subDir, { recursive: true });

    writeFileSync(
      join(subDir, "Step.flyde.js"),
      `module.exports = {
        id: "Step",
        inputs: { n: { mode: "required", type: "number" } },
        outputs: { r: { type: "number" } },
        run: (inputs, outputs) => outputs.r.next(inputs.n + 5)
      };`
    );

    writeFileSync(
      join(subDir, "ChildFlow.flyde"),
      `imports: {}
node:
  id: ChildFlow
  inputs:
    n:
      mode: required
      type: number
  outputs:
    r:
      type: number
  instances:
    - id: step1
      nodeId: Step
      type: code
      source:
        type: file
        data: ./Step.flyde.js
      config: {}
      inputConfig: {}
      pos:
        x: 0
        y: 0
  connections:
    - from:
        insId: __this
        pinId: n
      to:
        insId: step1
        pinId: n
    - from:
        insId: step1
        pinId: r
      to:
        insId: __this
        pinId: r
  inputsPosition: {}
  outputsPosition: {}
`
    );

    const parentPath = join(tempRoot, "ParentFlow.flyde");
    const parentRaw = `imports: {}
node:
  id: ParentFlow
  inputs:
    n:
      mode: required
      type: number
  outputs:
    r:
      type: number
  instances:
    - id: child1
      nodeId: ChildFlow
      type: visual
      source:
        type: file
        data: ./subflows/ChildFlow.flyde
      inputConfig: {}
      pos:
        x: 0
        y: 0
  connections:
    - from:
        insId: __this
        pinId: n
      to:
        insId: child1
        pinId: n
    - from:
        insId: child1
        pinId: r
      to:
        insId: __this
        pinId: r
  inputsPosition: {}
  outputsPosition: {}
`;
    writeFileSync(parentPath, parentRaw);

    const resolvedRuntime = resolveFlowByPath(parentPath);
    const [spy, r] = spiedOutput();
    const n = dynamicNodeInput();

    execute({
      node: resolvedRuntime,
      inputs: { n },
      outputs: { r },
    });

    n.subject.next(3);
    assert.equal(spy.lastCall.args[0], 8);

    const parsedParent = deserializeFlow(parentRaw, parentPath);
    const editorNode = resolveEditorNode(
      parsedParent.node,
      createServerReferencedNodeFinder(parentPath)
    );
    const childEditorNode = editorNode.instances[0].node as any;
    assert.equal(childEditorNode.id, "ChildFlow");
    assert.equal(childEditorNode.instances[0].node.id, "Step__step1");
  });

  it("resolves custom editorComponentBundlePath relative to moved code node file", () => {
    const subDir = join(tempRoot, "custom-ui");
    mkdirSync(subDir, { recursive: true });

    writeFileSync(join(subDir, "bundle.js"), "window.__customBundle = true;");
    writeFileSync(
      join(subDir, "CustomUiNode.flyde.js"),
      `module.exports = {
        id: "CustomUiNode",
        inputs: { n: { type: "number" } },
        outputs: { r: { type: "number" } },
        editorConfig: {
          type: "custom",
          editorComponentBundlePath: "./bundle.js"
        },
        run: (inputs, outputs) => outputs.r.next(inputs.n)
      };`
    );

    const flowPath = join(tempRoot, "FlowWithCustomUi.flyde");
    const finder = createServerReferencedNodeFinder(flowPath);
    const resolved = finder({
      id: "ins1",
      nodeId: "CustomUiNode",
      type: "code",
      source: {
        type: "file",
        data: "./custom-ui/CustomUiNode.flyde.js",
      },
      config: {},
      inputConfig: {},
      pos: { x: 0, y: 0 },
    }) as any;

    assert.equal(
      resolved.editorConfig.editorComponentBundleContent,
      "window.__customBundle = true;"
    );
  });

  it("updates relative file imports when an imported file or the flow itself is moved", () => {
    const rawFlow = `imports:
  ./legacy/OldHelper.flyde.js:
    - OldHelper
node:
  id: ParentFlow
  inputs: {}
  outputs: {}
  instances:
    - id: child1
      nodeId: ChildFlow
      type: visual
      source:
        type: file
        data: ./ChildFlow.flyde
      inputConfig: {}
      pos:
        x: 0
        y: 0
    - id: inline1
      nodeId: InlineGroup
      type: visual
      source:
        type: inline
        data:
          id: InlineGroup
          inputs: {}
          outputs: {}
          instances:
            - id: code1
              nodeId: HelperNode
              type: code
              source:
                type: file
                data: ChildHelper.flyde.ts
              config: {}
              inputConfig: {}
              pos:
                x: 0
                y: 0
          connections: []
          inputsPosition: {}
          outputsPosition: {}
      inputConfig: {}
      pos:
        x: 10
        y: 10
  connections: []
  inputsPosition: {}
  outputsPosition: {}
`;

    const oldFlowPath = "/workspace/project/ParentFlow.flyde";
    const newFlowPath = "/workspace/project/flows/ParentFlow.flyde";

    const result = updateFlowImportsForMovedFiles(
      rawFlow,
      oldFlowPath,
      newFlowPath,
      [
        {
          oldPath: "/workspace/project/ParentFlow.flyde",
          newPath: "/workspace/project/flows/ParentFlow.flyde",
        },
        {
          oldPath: "/workspace/project/ChildFlow.flyde",
          newPath: "/workspace/project/subflows/ChildFlow.flyde",
        },
      ]
    );

    assert.isTrue(result.changed);
    assert.include(result.content, "../subflows/ChildFlow.flyde");
    assert.include(result.content, "../ChildHelper.flyde.ts");
    assert.include(result.content, "../legacy/OldHelper.flyde.js");
  });

  it("keeps intra-folder relative imports unchanged when a folder is moved as a unit", () => {
    const rawFlow = `imports: {}
node:
  id: SubFlow
  inputs: {}
  outputs: {}
  instances:
    - id: local1
      nodeId: LocalNode
      type: code
      source:
        type: file
        data: ./LocalNode.flyde.ts
      config: {}
      inputConfig: {}
      pos:
        x: 0
        y: 0
    - id: external1
      nodeId: SharedNode
      type: code
      source:
        type: file
        data: ../shared/SharedNode.flyde.ts
      config: {}
      inputConfig: {}
      pos:
        x: 0
        y: 0
  connections: []
  inputsPosition: {}
  outputsPosition: {}
`;

    const result = updateFlowImportsForMovedFiles(
      rawFlow,
      "/workspace/project/feature/SubFlow.flyde",
      "/workspace/project/src/feature/SubFlow.flyde",
      [
        {
          oldPath: "/workspace/project/feature",
          newPath: "/workspace/project/src/feature",
        },
      ]
    );

    assert.isTrue(result.changed);
    assert.include(result.content, "./LocalNode.flyde.ts");
    assert.include(result.content, "../../shared/SharedNode.flyde.ts");
  });
});
