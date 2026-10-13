import { strict as assert } from "assert";
import { parse } from "yaml";
import { join } from "path";
import { mkdtempSync, mkdirSync, writeFileSync, renameSync, rmSync } from "fs";
import { tmpdir } from "os";
import { codeNodeInstance } from "@flyde/core";
import { createServerReferencedNodeFinder } from "../resolver/server/findReferencedNodeServer";
import { getFileImportRenameEdits, FileRename } from "./renameFileImports";

const root = join(process.cwd(), "rename-test");
const flowPath = join(root, "Main.flyde");
const flow = (path: string, type = "file") => `# flow comment\nnode:\n  id: Main\n  instances:\n    - source:\n        type: ${type}\n        data: ${JSON.stringify(path)} # import comment\n      config: { data: './Node.flyde.ts' }\n`;
const move = (oldPath: string, newPath: string): FileRename => ({
  oldPath: join(root, oldPath), newPath: join(root, newPath),
});
const rewrite = (text: string, renames: FileRename[], path = flowPath) =>
  getFileImportRenameEdits(text, path, renames)
    .sort((a, b) => b.start - a.start)
    .reduce((result, edit) => result.slice(0, edit.start) + edit.text + result.slice(edit.end), text);
const source = (text: string) => parse(text).node.instances[0].source.data;

describe("file import renames", () => {
  it("resolves a code node after moving its file", () => {
    const directory = mkdtempSync(join(tmpdir(), "flyde-rename-"));
    try {
      const oldPath = join(directory, "Node.flyde.js");
      const newPath = join(directory, "lib/Node.flyde.js");
      const mainPath = join(directory, "Main.flyde");
      writeFileSync(oldPath, `exports.Node = { id: 'Node', inputs: {}, outputs: {}, run() {} };`);
      const finder = createServerReferencedNodeFinder(mainPath);
      const instance = codeNodeInstance("node", "Node", { type: "file", data: "./Node.flyde.js" });
      assert.equal(finder(instance).id, "Node");
      const updated = rewrite(flow("./Node.flyde.js"), [{ oldPath, newPath }], mainPath);
      mkdirSync(join(directory, "lib"));
      renameSync(oldPath, newPath);
      assert.throws(() => finder(instance));
      instance.source.data = source(updated);
      assert.equal(finder(instance).id, "Node");
    } finally {
      rmSync(directory, { recursive: true, force: true });
    }
  });
  for (const extension of ["flyde", "flyde.ts", "flyde.js"]) {
    it(`updates a moved ${extension} import and preserves surrounding text`, () => {
      const text = flow(`./Node.${extension}`);
      assert.equal(rewrite(text, [move(`Node.${extension}`, `lib/Node.${extension}`)]),
        text.replace(`"./Node.${extension}"`, `"./lib/Node.${extension}"`));
    });
  }

  it("rebases a moved importing flow", () => {
    assert.equal(source(rewrite(flow("./Node.flyde.ts"), [move("Main.flyde", "flows/Main.flyde")])),
      "../Node.flyde.ts");
  });

  it("updates imports when their containing folder moves", () => {
    assert.equal(source(rewrite(flow("./lib/Node.flyde.ts"), [move("lib", "shared")])),
      "./shared/Node.flyde.ts");
  });

  it("leaves relative paths intact when both files move together", () => {
    const text = flow("./Node.flyde.ts");
    assert.equal(rewrite(text, [move("lib", "shared")], join(root, "lib/Main.flyde")), text);
  });

  it("applies batch moves simultaneously", () => {
    assert.equal(source(rewrite(flow("./Node.flyde.ts"), [
      move("Node.flyde.ts", "lib/Node.flyde.ts"),
      move("lib", "other"),
      move("Main.flyde", "flows/Main.flyde"),
    ])), "../lib/Node.flyde.ts");
  });

  it("uses the most specific move and respects folder boundaries", () => {
    assert.equal(source(rewrite(flow("./lib/Node.flyde.ts"), [
      move("lib", "shared"), move("lib/Node.flyde.ts", "Node.flyde.ts"),
    ])), "./Node.flyde.ts");
    const text = flow("./library/Node.flyde.ts");
    assert.equal(rewrite(text, [move("lib", "shared")]), text);
  });

  it("visits current and legacy inline nodes without changing configuration", () => {
    const text = `node:\n  instances:\n    - source:\n        type: inline\n        data:\n          instances:\n            - source: { type: file, data: './Node.flyde.ts' }\n    - node:\n        instances:\n          - source: { type: file, data: './Node.flyde.ts' }\n      config: { source: { type: file, data: './Node.flyde.ts' } }\n`;
    const result = parse(rewrite(text, [move("Node.flyde.ts", "lib/Node.flyde.ts")]));
    assert.equal(result.node.instances[0].source.data.instances[0].source.data, "./lib/Node.flyde.ts");
    assert.equal(result.node.instances[1].node.instances[0].source.data, "./lib/Node.flyde.ts");
    assert.equal(result.node.instances[1].config.source.data, "./Node.flyde.ts");
  });

  it("updates legacy local import keys and leaves package imports intact", () => {
    const text = `imports:\n  './Node.flyde.ts': [Node] # keep\n  '@flyde/nodes': [Value]\nnode: { instances: [] }\n`;
    assert.equal(rewrite(text, [move("Node.flyde.ts", "lib/Node.flyde.ts")]),
      text.replace("'./Node.flyde.ts'", '"./lib/Node.flyde.ts"'));
  });

  it("leaves package, custom, self, and unrelated file sources intact", () => {
    for (const type of ["package", "custom", "self"]) {
      const text = flow("./Node.flyde.ts", type);
      assert.equal(rewrite(text, [move("Node.flyde.ts", "lib/Node.flyde.ts")]), text);
    }
    const text = flow("./Other.flyde.ts");
    assert.equal(rewrite(text, [move("Node.flyde.ts", "lib/Node.flyde.ts")]), text);
  });

  it("ignores invalid YAML and non-string paths", () => {
    for (const text of ["node: [", "node: null", "node: { instances: [{ source: { type: file, data: 123 } }] }"]) {
      assert.deepEqual(getFileImportRenameEdits(text, flowPath, [move("lib", "shared")]), []);
    }
  });
});
