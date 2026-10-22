import * as assert from "assert";
import * as path from "path";
import { parse } from "yaml";
import { movedPath, remapFlowPaths } from "../remapFlowPaths";

suite("flow file moves", () => {
  const root = path.resolve("test-workspace");
  const file = (relative: string) => path.join(root, relative);
  const flow = (target: string, type = "file") =>
    `# keep this comment\nnode:\n  instances:\n    - id: child\n      source:\n        type: ${type}\n        data: '${target}' # source comment\n`;
  const source = (text: string) => parse(text).node.instances[0].source.data;
  test("renames a referenced file and preserves comments", () => {
    const result = remapFlowPaths(flow("./Child.flyde"), file("Parent.flyde"), [
      { oldPath: file("Child.flyde"), newPath: file("nodes/Renamed.flyde") },
    ])!;
    assert.strictEqual(source(result), "./nodes/Renamed.flyde");
    assert.ok(result.includes("# keep this comment"));
    assert.ok(result.includes("# source comment"));
  });
  test("rebases outgoing references when the parent flow moves", () => {
    const result = remapFlowPaths(flow("./Child.flyde"), file("Parent.flyde"), [
      { oldPath: file("Parent.flyde"), newPath: file("flows/Parent.flyde") },
    ])!;
    assert.strictEqual(source(result), "../Child.flyde");
  });
  test("a whole folder move keeps relationships within it unchanged", () => {
    assert.strictEqual(remapFlowPaths(flow("./Child.flyde"), file("old/Parent.flyde"), [
      { oldPath: file("old"), newPath: file("new") },
    ]), undefined);
  });
  test("folder moves update incoming references", () => {
    assert.strictEqual(source(remapFlowPaths(flow("./old/Child.flyde"), file("Parent.flyde"), [
      { oldPath: file("old"), newPath: file("new") },
    ])!), "./new/Child.flyde");
  });
  test("folder names are matched by path boundary, not string prefix", () => {
    assert.strictEqual(movedPath(file("nodes-other/Child.flyde"), [
      { oldPath: file("nodes"), newPath: file("renamed") },
    ]), file("nodes-other/Child.flyde"));
  });
  test("simultaneous swaps are applied only once", () => {
    assert.strictEqual(source(remapFlowPaths(flow("./A.flyde"), file("Parent.flyde"), [
      { oldPath: file("A.flyde"), newPath: file("B.flyde") },
      { oldPath: file("B.flyde"), newPath: file("A.flyde") },
    ])!), "./B.flyde");
  });
  test("nested inline flows are visited", () => {
    const text = `node:\n  instances:\n    - node:\n        instances:\n          - source:\n              type: file\n              data: ./Child.flyde\n`;
    const result = remapFlowPaths(text, file("Parent.flyde"), [
      { oldPath: file("Child.flyde"), newPath: file("New.flyde") },
    ])!;
    assert.strictEqual(parse(result).node.instances[0].node.instances[0].source.data, "./New.flyde");
  });
  test("package references are not modified", () => {
    assert.strictEqual(remapFlowPaths(flow("./Child.flyde", "package"), file("Parent.flyde"), [
      { oldPath: file("Child.flyde"), newPath: file("New.flyde") },
    ]), undefined);
  });
  test("unrelated moves return no edit", () => {
    assert.strictEqual(remapFlowPaths(flow("./Child.flyde"), file("Parent.flyde"), [
      { oldPath: file("Other.flyde"), newPath: file("New.flyde") },
    ]), undefined);
  });
  test("absolute references remain absolute", () => {
    const target = file("Child.flyde");
    assert.strictEqual(source(remapFlowPaths(flow(target), file("Parent.flyde"), [
      { oldPath: target, newPath: file("New.flyde") },
    ])!), file("New.flyde"));
  });
  test("more specific nested moves win", () => {
    assert.strictEqual(movedPath(file("old/Child.flyde"), [
      { oldPath: file("old"), newPath: file("new") },
      { oldPath: file("old/Child.flyde"), newPath: file("special.flyde") },
    ]), file("special.flyde"));
  });
  test("invalid YAML is rejected without producing replacement text", () => {
    assert.throws(() => remapFlowPaths("node: [", file("Parent.flyde"), []));
  });
});
