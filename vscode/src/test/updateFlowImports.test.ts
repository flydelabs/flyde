import * as path from "path";
import {
  mapOriginalPath,
  mapRenamedPath,
  updateFlowImports,
} from "../updateFlowImports";

import assert = require("assert");

const root = path.resolve("/ws");
const p = (...parts: string[]) => path.join(root, ...parts);

const flow = `imports:
  ./Child.flyde:
    - Child
  "./lib/helpers.flyde.ts":
    - helper
  "@flyde/stdlib":
    - Add
node:
  id: Parent
  instances: []
`;

suite("updateFlowImports", () => {
  test("rewrites an import when the imported file moves to another folder", () => {
    const result = updateFlowImports(flow, p("flows"), p("flows"), [
      { oldPath: p("flows", "Child.flyde"), newPath: p("flows", "sub", "Child.flyde") },
    ]);
    assert(result.includes("  ./sub/Child.flyde:\n    - Child"));
    assert(result.includes('  "./lib/helpers.flyde.ts":'));
  });

  test("rewrites imports when the importing flow itself moves", () => {
    const result = updateFlowImports(flow, p("flows"), p("flows", "deep"), [
      { oldPath: p("flows", "Parent.flyde"), newPath: p("flows", "deep", "Parent.flyde") },
    ]);
    assert(result.includes("  ../Child.flyde:"));
    assert(result.includes('  "../lib/helpers.flyde.ts":'));
  });

  test("rewrites imports inside a moved folder", () => {
    const result = updateFlowImports(flow, p("flows"), p("flows"), [
      { oldPath: p("flows", "lib"), newPath: p("flows", "utils") },
    ]);
    assert(result.includes('  "./utils/helpers.flyde.ts":'));
  });

  test("keeps package imports, other content and line endings untouched", () => {
    const crlf = flow.replace(/\n/g, "\r\n");
    const result = updateFlowImports(crlf, p("flows"), p("flows"), [
      { oldPath: p("flows", "Child.flyde"), newPath: p("flows", "Kid.flyde") },
    ]);
    assert(result.includes('  "@flyde/stdlib":\r\n'));
    assert(result.includes("node:\r\n  id: Parent"));
    assert(result.includes("  ./Kid.flyde:\r\n"));
  });

  test("returns the same text when nothing it imports moved", () => {
    const result = updateFlowImports(flow, p("flows"), p("flows"), [
      { oldPath: p("other.flyde"), newPath: p("renamed.flyde") },
    ]);
    assert.strictEqual(result, flow);
  });

  test("does not treat list entries or later top level keys as imports", () => {
    const text = `imports:
  ./a.flyde:
    - ./a.flyde
node:
  ./a.flyde: not-an-import
`;
    const result = updateFlowImports(text, p("f"), p("f"), [
      { oldPath: p("f", "a.flyde"), newPath: p("f", "b.flyde") },
    ]);
    assert(result.includes("  ./b.flyde:\n    - ./a.flyde\nnode:\n  ./a.flyde: not-an-import"));
  });

  test("maps paths through renames in both directions", () => {
    const renames = [{ oldPath: p("a"), newPath: p("b") }];
    assert.strictEqual(mapRenamedPath(p("a", "x.flyde"), renames), p("b", "x.flyde"));
    assert.strictEqual(mapOriginalPath(p("b", "x.flyde"), renames), p("a", "x.flyde"));
    assert.strictEqual(mapRenamedPath(p("ab", "x.flyde"), renames), undefined);
  });
});
