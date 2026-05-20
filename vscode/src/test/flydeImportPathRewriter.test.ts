import * as assert from "assert";
import * as path from "path";
import { deserializeFlow } from "@flyde/loader";
import {
  rewriteMovedFlowImports,
  rewriteMovedImportTarget,
} from "../flydeImportPathRewriter";

const flowContent = `
imports: {}
node:
  id: ParentFlow
  inputs: {}
  outputs: {}
  instances:
    - id: child
      nodeId: ChildFlow
      inputConfig: {}
      config: {}
      pos:
        x: 300
        y: 200
      type: visual
      source:
        type: file
        data: ../nodes/ChildFlow.flyde
  connections: []
  inputsPosition: {}
  outputsPosition: {}
`;

suite("flyde import path rewriter", () => {
  test("rewrites local imports inside a moved flow relative to the new flow path", () => {
    const oldFlowPath = path.join("/workspace", "flows", "ParentFlow.flyde");
    const newFlowPath = path.join("/workspace", "flows", "nested", "ParentFlow.flyde");

    const result = rewriteMovedFlowImports(flowContent, oldFlowPath, newFlowPath);
    const flow = deserializeFlow(result.content, newFlowPath);

    assert.strictEqual(result.changed, true);
    const source = flow.node.instances[0].source;
    assert.strictEqual(source.type, "file");
    assert.strictEqual(source.data, "../../nodes/ChildFlow.flyde");
  });

  test("rewrites references when the imported flow target moves", () => {
    const flowPath = path.join("/workspace", "flows", "ParentFlow.flyde");
    const oldTargetPath = path.join("/workspace", "nodes", "ChildFlow.flyde");
    const newTargetPath = path.join("/workspace", "shared", "ChildFlow.flyde");

    const result = rewriteMovedImportTarget(
      flowContent,
      flowPath,
      oldTargetPath,
      newTargetPath
    );
    const flow = deserializeFlow(result.content, flowPath);

    assert.strictEqual(result.changed, true);
    const source = flow.node.instances[0].source;
    assert.strictEqual(source.type, "file");
    assert.strictEqual(source.data, "../shared/ChildFlow.flyde");
  });
});
