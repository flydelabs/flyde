import * as assert from "assert";
import { getFlowImportEdits, FileMove } from "../flowImportEdits";
import { parse } from "yaml";

function flow(source: string, type = "file") {
  return `# preserved comment\nnode:\n  instances:\n    - source: {type: ${type}, data: ${JSON.stringify(source)}} # node comment\n      config: {data: "./Node.flyde.ts"}\n`;
}

function apply(text: string, moves: FileMove[], importer = "/project/Main.flyde") {
  return getFlowImportEdits(text, importer, moves)
    .sort((a, b) => b.start - a.start)
    .reduce((result, edit) => result.slice(0, edit.start) + edit.text + result.slice(edit.end), text);
}

const move = [{ oldPath: "/project/Node.flyde.ts", newPath: "/project/nodes/Node.flyde.ts" }];

suite("Flow import renames", () => {
  test("updates a moved code node without changing comments or config", () => {
    assert.strictEqual(apply(flow("./Node.flyde.ts"), move), flow("./nodes/Node.flyde.ts"));
  });

  test("updates visual node references and extensionless local sources", () => {
    const moves = [{ oldPath: "/project/nodes", newPath: "/project/lib" }];
    assert.strictEqual(apply(flow("./nodes/Child.flyde"), moves), flow("./lib/Child.flyde"));
    assert.strictEqual(apply(flow("nodes/Child"), moves), flow("./lib/Child"));
  });

  test("rebases imports when the importer moves", () => {
    const moves = [{ oldPath: "/project/Main.flyde", newPath: "/project/flows/Main.flyde" }];
    assert.strictEqual(apply(flow("./Node.flyde.ts"), moves), flow("../Node.flyde.ts"));
  });

  test("keeps references unchanged when a whole subtree moves together", () => {
    const input = flow("./Node.flyde.ts");
    assert.strictEqual(apply(input, [{ oldPath: "/project", newPath: "/renamed" }]), input);
  });

  test("uses simultaneous original paths for batched moves", () => {
    const moves = [...move, { oldPath: "/project/Main.flyde", newPath: "/project/flows/Main.flyde" }];
    assert.strictEqual(apply(flow("./Node.flyde.ts"), moves), flow("../nodes/Node.flyde.ts"));
  });

  test("does not match sibling names with a common directory prefix", () => {
    const input = flow("./nodes-extra/A.flyde");
    assert.strictEqual(apply(input, [{ oldPath: "/project/nodes", newPath: "/project/lib" }]), input);
  });

  test("leaves package and custom sources alone", () => {
    for (const type of ["package", "custom"]) {
      const input = flow("./Node.flyde.ts", type);
      assert.strictEqual(apply(input, move), input);
    }
  });

  test("updates nested inline nodes", () => {
    const input = "node:\n  instances:\n    - source:\n        type: inline\n        data:\n          instances:\n            - source: {type: file, data: './Node.flyde.ts'}\n";
    const output = parse(apply(input, move));
    assert.strictEqual(output.node.instances[0].source.data.instances[0].source.data, "./nodes/Node.flyde.ts");
  });

  test("updates legacy imports without rewriting the flow format", () => {
    const input = "imports:\n  './Node.flyde.ts': [Node] # preserve\n  '@flyde/nodes': [Value]\nnode: {instances: []}\n";
    assert.strictEqual(apply(input, move), input.replace("'./Node.flyde.ts'", '"./nodes/Node.flyde.ts"'));
  });

  test("handles Windows URI paths and backslashes in relative references", () => {
    const moves = [{ oldPath: "/C:/project/Node.flyde.ts", newPath: "/C:/project/nodes/Node.flyde.ts" }];
    assert.strictEqual(apply(flow(".\\Node.flyde.ts"), moves, "/C:/project/Main.flyde"), flow("./nodes/Node.flyde.ts"));
  });

  test("updates bare legacy file imports used by existing flows", () => {
    const input = "imports:\n  Node.flyde.ts: [Node]\n  '@flyde/nodes': [Value]\nnode: {instances: []}\n";
    const output = parse(apply(input, move));
    assert.deepStrictEqual(output.imports["./nodes/Node.flyde.ts"], ["Node"]);
    assert.deepStrictEqual(output.imports["@flyde/nodes"], ["Value"]);
  });

  test("matches Windows drive casing returned by workspace file search", () => {
    const moves = [{ oldPath: "/E:/project/Node.flyde.ts", newPath: "/E:/project/nodes/Node.flyde.ts" }];
    assert.strictEqual(apply(flow("./Node.flyde.ts"), moves, "/e:/project/Main.flyde"), flow("./nodes/Node.flyde.ts"));
  });

  test("quotes paths containing YAML punctuation safely", () => {
    const moves = [{ oldPath: "/project/Node.flyde.ts", newPath: "/project/a: #b/Node.flyde.ts" }];
    assert.strictEqual(parse(apply(flow("./Node.flyde.ts"), moves)).node.instances[0].source.data, "./a: #b/Node.flyde.ts");
  });

  test("rejects invalid YAML rather than editing it", () => {
    assert.throws(() => apply("node: [\n", move));
  });
});
