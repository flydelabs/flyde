import * as assert from "assert";
import * as path from "path";
import {
  rewriteMovedFlowImports,
  rewriteReferencesToMovedFile,
  toFlydeImportPath,
} from "../flydeImportPathRewriter";

suite("flyde import path rewriter", () => {
  test("rewrites a moved flow's own relative imports", () => {
    const content = [
      "imports: {}",
      "node:",
      "  instances:",
      "    - source:",
      "        type: file",
      "        data: ./ChildFlow.flyde",
      "      nodeId: ChildFlow",
      "",
    ].join("\n");

    const rewritten = rewriteMovedFlowImports(
      content,
      path.join("workspace", "flows", "ParentFlow.flyde"),
      path.join("workspace", "flows", "nested", "ParentFlow.flyde")
    );

    assert.match(rewritten, /data: \.\.\/ChildFlow\.flyde/);
  });

  test("rewrites references when the imported flow moves", () => {
    const content = [
      "imports: {}",
      "node:",
      "  instances:",
      "    - source:",
      "        type: file",
      "        data: ./ChildFlow.flyde",
      "      nodeId: ChildFlow",
      "",
    ].join("\n");

    const rewritten = rewriteReferencesToMovedFile(
      content,
      path.join("workspace", "flows", "ParentFlow.flyde"),
      path.join("workspace", "flows", "ChildFlow.flyde"),
      path.join("workspace", "shared", "ChildFlow.flyde")
    );

    assert.match(rewritten, /data: \.\.\/shared\/ChildFlow\.flyde/);
  });

  test("leaves package sources untouched", () => {
    const content = [
      "node:",
      "  instances:",
      "    - source:",
      "        type: package",
      "        data: \"@flyde/nodes\"",
      "      nodeId: Add",
      "",
    ].join("\n");

    const rewritten = rewriteMovedFlowImports(
      content,
      path.join("workspace", "flows", "ParentFlow.flyde"),
      path.join("workspace", "nested", "ParentFlow.flyde")
    );

    assert.strictEqual(rewritten, content);
  });

  test("uses relative POSIX import paths for same-folder targets", () => {
    const importPath = toFlydeImportPath(
      path.join("workspace", "flows", "ParentFlow.flyde"),
      path.join("workspace", "flows", "ChildFlow.flyde")
    );

    assert.strictEqual(importPath, "./ChildFlow.flyde");
  });
});
