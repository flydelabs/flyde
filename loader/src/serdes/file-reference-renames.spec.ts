import { strict as assert } from "assert";
import { resolve } from "path";
import { parse } from "yaml";
import { fileReferenceEditsForRenames, FileReferenceRename } from "./file-reference-renames";

const root = resolve("rename-fixture");
const at = (path: string) => resolve(root, path);
const text = (reference: string, type = "file") => `# keep comment\nnode:\n  instances:\n    - source: { type: ${type}, data: '${reference}' } # import\n      config: { note: '${reference}' }\n`;
const rewrite = (input: string, file: string, renames: FileReferenceRename[]) =>
  fileReferenceEditsForRenames(input, at(file), renames).sort((a, b) => b.start - a.start)
    .reduce((content, edit) => content.slice(0, edit.start) + edit.text + content.slice(edit.end), input);
const move = (oldPath: string, newPath: string) => ({ oldPath: at(oldPath), newPath: at(newPath) });
const source = (input: string) => parse(input).node.instances[0].source.data;

describe("preserving file references across rename batches", () => {
  it("replaces only a moved producer's YAML scalar", () => {
    const before = text("./Child.flyde");
    const after = rewrite(before, "Main.flyde", [move("Child.flyde", "parts/Child.flyde")]);
    assert.equal(source(after), "./parts/Child.flyde");
    assert.equal(after, before.replace("data: './Child.flyde'", 'data: "./parts/Child.flyde"'));
  });
  it("rebases a moved importing flow", () => {
    assert.equal(source(rewrite(text("./Child.flyde"), "Main.flyde", [move("Main.flyde", "flows/Main.flyde")])), "../Child.flyde");
  });
  it("uses both original paths for independently moved producer and consumer", () => {
    assert.equal(source(rewrite(text("./Child.flyde"), "Main.flyde", [move("Main.flyde", "flows/Main.flyde"), move("Child.flyde", "parts/Child.flyde")])), "../parts/Child.flyde");
  });
  it("keeps a reference unchanged when its entire folder moves", () => {
    const before = text("./Child.flyde");
    assert.equal(rewrite(before, "components/Main.flyde", [move("components", "parts")]), before);
  });
  it("does not confuse a containing folder with a similarly named sibling", () => {
    const before = text("./components-extra/Child.flyde");
    assert.equal(rewrite(before, "Main.flyde", [move("components", "parts")]), before);
  });
  it("maps a batch once and chooses the most specific original source", () => {
    assert.equal(source(rewrite(text("./components/Child.flyde"), "Main.flyde", [move("components", "parts"), move("components/Child.flyde", "Child2.flyde"), move("Child2.flyde", "Child3.flyde")])), "./Child2.flyde");
  });
  it("traverses nested inline flows while leaving package/custom references alone", () => {
    const before = `node:\n  instances:\n    - source:\n        type: inline\n        data:\n          instances:\n            - source: { type: file, data: ./Child.flyde }\n            - source: { type: package, data: ./Child.flyde }\n            - source: { type: custom, data: ./Child.flyde }\n`;
    const after = parse(rewrite(before, "Main.flyde", [move("Child.flyde", "parts/Child.flyde")]));
    assert.deepEqual(after.node.instances[0].source.data.instances.map((instance: any) => instance.source.data), ["./parts/Child.flyde", "./Child.flyde", "./Child.flyde"]);
  });
  it("updates relative legacy import-map keys only", () => {
    const before = "imports:\n  './Child.flyde': [Child]\n  '@flyde/nodes': [Value]\nnode: {}\n";
    assert.deepEqual(parse(rewrite(before, "Main.flyde", [move("Child.flyde", "parts/Child.flyde")])).imports, { "./parts/Child.flyde": ["Child"], "@flyde/nodes": ["Value"] });
  });
  it("preserves absolute imports and safely quotes YAML punctuation in new names", () => {
    const next = at("parts/Child: #2.flyde");
    assert.equal(source(rewrite(text(at("Child.flyde")), "Main.flyde", [move("Child.flyde", "parts/Child: #2.flyde")])), next);
  });
  it("rejects malformed YAML instead of guessing at source ranges", () => {
    assert.throws(() => rewrite("node: [", "Main.flyde", [move("Child.flyde", "parts/Child.flyde")]));
  });
  for (const style of [">-", "|-"]) {
    it(`preserves the next property and header comment after a ${style} block scalar`, () => {
      const before = `node:\n  instances:\n    - source:\n        type: file\n        data: ${style} # path comment\n          ./Child.flyde\n      inputConfig: {}\n`;
      const after = rewrite(before, "Main.flyde", [move("Child.flyde", "parts/Child.flyde")]);
      assert.equal(source(after), "./parts/Child.flyde");
      assert.deepEqual(parse(after).node.instances[0].inputConfig, {});
      assert(after.includes('# path comment\n      inputConfig: {}'));
    });
  }
  it("does not rewrite anchors whose aliases may be used by unrelated data", () => {
    const before = "node:\n  instances:\n    - source: {type: file, data: &path ./Child.flyde}\n      config: {note: *path}\n";
    assert.equal(rewrite(before, "Main.flyde", [move("Child.flyde", "parts/Child.flyde")]), before);
  });
});
