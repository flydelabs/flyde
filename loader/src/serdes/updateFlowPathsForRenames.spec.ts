import { assert } from "chai";
import * as yaml from "yaml";
import { updateFlowPathsForRenames } from "./updateFlowPathsForRenames";

const flowPath = "/workspace/flows/main.flyde";
const reference = (data: string, type = "file") =>
  `node:\n  instances:\n    - source:\n        type: ${type}\n        data: ${data}\n`;

describe("updateFlowPathsForRenames", () => {
  it("renames a file reference and preserves comments, quotes, CRLF and unrelated data", () => {
    const raw = "# keep this\r\nnode:\r\n  instances:\r\n    - source:\r\n        type: file\r\n        data: './old.flyde' # dependency\r\n      config: {value: './old.flyde'}\r\n";
    const result = updateFlowPathsForRenames(raw, flowPath, [
      { oldPath: "/workspace/flows/old.flyde", newPath: "/workspace/flows/new.flyde" },
    ]);
    assert.equal(result, raw.replace("data: './old.flyde'", "data: './new.flyde'"));
  });

  it("updates bare code file references and both legacy file import suffixes", () => {
    const raw = "imports:\n  old.flyde.ts: [Code]\n  './old.flyde': Visual\n  '@flyde/nodes': [Add]\n  some-package: [Other]\n" + reference("old.flyde.ts");
    const result = updateFlowPathsForRenames(raw, flowPath, [
      { oldPath: "/workspace/flows/old.flyde.ts", newPath: "/workspace/flows/new.flyde.ts" },
      { oldPath: "/workspace/flows/old.flyde", newPath: "/workspace/flows/new.flyde" },
    ]);
    assert.equal(result, raw.replace(/old\.flyde/g, "new.flyde"));
    assert.deepEqual(Object.keys(yaml.parse(result).imports), ["new.flyde.ts", "./new.flyde", "@flyde/nodes", "some-package"]);
  });

  it("maps folder descendants without matching a shared string prefix", () => {
    const raw = "node:\n  instances:\n    - source: {type: file, data: ../nodes/child.flyde}\n    - source: {type: file, data: ../nodes-extra/child.flyde}\n";
    const result = updateFlowPathsForRenames(raw, flowPath, [
      { oldPath: "/workspace/nodes", newPath: "/workspace/renamed" },
    ]);
    assert.equal(result, raw.replace("../nodes/child.flyde", "../renamed/child.flyde"));
  });

  it("rebases an external dependency when only the importer moves", () => {
    assert.equal(
      updateFlowPathsForRenames(reference("../nodes/child.flyde"), flowPath, [
        { oldPath: flowPath, newPath: "/workspace/archive/flows/main.flyde" },
      ]),
      reference("../../nodes/child.flyde")
    );
  });

  it("leaves references unchanged when importer and dependency move together", () => {
    assert.isUndefined(updateFlowPathsForRenames(reference("./child.flyde"), flowPath, [
      { oldPath: "/workspace/flows", newPath: "/workspace/renamed" },
    ]));
  });

  it("maps an independently moved importer and dependency against the original batch", () => {
    assert.equal(
      updateFlowPathsForRenames(reference("../nodes/child.flyde"), flowPath, [
        { oldPath: "/workspace/nodes/child.flyde", newPath: "/workspace/shared/new.flyde" },
        { oldPath: flowPath, newPath: "/workspace/archive/main.flyde" },
      ]),
      reference("../shared/new.flyde")
    );
  });

  it("does not chain renames in a batch", () => {
    assert.equal(
      updateFlowPathsForRenames(reference("./a.flyde"), flowPath, [
        { oldPath: "/workspace/flows/a.flyde", newPath: "/workspace/flows/b.flyde" },
        { oldPath: "/workspace/flows/b.flyde", newPath: "/workspace/flows/c.flyde" },
      ]),
      reference("./b.flyde")
    );
  });

  it("uses the most specific original path when file and folder renames overlap", () => {
    assert.equal(
      updateFlowPathsForRenames(reference("../nodes/child.flyde"), flowPath, [
        { oldPath: "/workspace/nodes", newPath: "/workspace/renamed" },
        { oldPath: "/workspace/nodes/child.flyde", newPath: "/workspace/special.flyde" },
      ]),
      reference("../special.flyde")
    );
  });

  it("updates modern and legacy nested inline visual nodes without touching package or config paths", () => {
    const raw = "node:\n  instances:\n    - source:\n        type: inline\n        data:\n          instances:\n            - source: {type: file, data: ./old.flyde}\n    - node:\n        instances:\n          - source: {type: file, data: ./old.flyde}\n    - source: {type: package, data: ./old.flyde}\n      config: {data: ./old.flyde}\n";
    const result = updateFlowPathsForRenames(raw, flowPath, [
      { oldPath: "/workspace/flows/old.flyde", newPath: "/workspace/flows/new.flyde" },
    ]);
    assert.equal(result, raw.replace(/type: file, data: \.\/old\.flyde/g, "type: file, data: ./new.flyde"));
  });

  it("keeps package imports and unrelated documents unchanged", () => {
    const raw = "imports:\n  '@flyde/nodes': [Add]\n  package: [Node]\n" + reference("'@flyde/nodes'", "package");
    assert.isUndefined(updateFlowPathsForRenames(raw, flowPath, [
      { oldPath: "/workspace/flows", newPath: "/workspace/moved" },
    ]));
    assert.isUndefined(updateFlowPathsForRenames(reference("./other.flyde"), flowPath, [
      { oldPath: "/workspace/flows/old.flyde", newPath: "/workspace/flows/new.flyde" },
    ]));
  });

  it("preserves an unreferenced anchor and double-quoted scalar", () => {
    const raw = reference('&dependency "./old.flyde"');
    assert.equal(updateFlowPathsForRenames(raw, flowPath, [
      { oldPath: "/workspace/flows/old.flyde", newPath: "/workspace/flows/new.flyde" },
    ]), raw.replace('"./old.flyde"', '"./new.flyde"'));
  });

  it("quotes a renamed plain scalar if its filename is not safe in YAML", () => {
    const result = updateFlowPathsForRenames(reference("./old.flyde"), flowPath, [
      { oldPath: "/workspace/flows/old.flyde", newPath: "/workspace/flows/new: file.flyde" },
    ]);
    assert.equal(yaml.parse(result).node.instances[0].source.data, "./new: file.flyde");
  });

  for (const filename of ["new,file.flyde", "new[file.flyde", "new]file.flyde", "new{file.flyde", "new}file.flyde"]) {
    it(`quotes renamed plain scalars containing flow delimiters (${filename})`, () => {
      const raw = "imports: {./old.flyde: [Visual], '@flyde/nodes': [Add]} # imports\nnode:\n  instances:\n    - source: {type: file, data: ./old.flyde} # dependency\n      config: {value: ./old.flyde}\n";
      const renamedReference = `./${filename}`;
      const result = updateFlowPathsForRenames(raw, flowPath, [
        { oldPath: "/workspace/flows/old.flyde", newPath: `/workspace/flows/${filename}` },
      ]);
      const encoded = JSON.stringify(renamedReference);
      assert.equal(result, raw
        .replace("{./old.flyde:", `{${encoded}:`)
        .replace("data: ./old.flyde}", `data: ${encoded}}`));
      const parsed = yaml.parse(result);
      assert.deepEqual(parsed.node.instances[0].source, { type: "file", data: renamedReference });
      assert.deepEqual(Object.keys(parsed.imports), [renamedReference, "@flyde/nodes"]);
    });
  }

  it("escapes renamed single-quoted paths without changing their quote style", () => {
    assert.equal(updateFlowPathsForRenames(reference("'./old.flyde'"), flowPath, [
      { oldPath: "/workspace/flows/old.flyde", newPath: "/workspace/flows/child's.flyde" },
    ]), reference("'./child''s.flyde'"));
  });

  it("does not change file reference spelling when only the flow filename changes", () => {
    assert.isUndefined(updateFlowPathsForRenames(reference("./nested/../child.flyde"), flowPath, [
      { oldPath: flowPath, newPath: "/workspace/flows/renamed.flyde" },
    ]));
  });

  it("updates absolute references independently of importer movement", () => {
    assert.equal(updateFlowPathsForRenames(reference("/workspace/nodes/old.flyde"), flowPath, [
      { oldPath: "/workspace/nodes/old.flyde", newPath: "/workspace/nodes/new.flyde" },
      { oldPath: flowPath, newPath: "/workspace/elsewhere/main.flyde" },
    ]), reference("/workspace/nodes/new.flyde"));
  });

  it("supports Windows paths without host-platform-dependent resolution", () => {
    assert.equal(updateFlowPathsForRenames(reference("../nodes/old.flyde.ts"), "C:\\workspace\\flows\\main.flyde", [
      { oldPath: "C:\\workspace\\nodes\\old.flyde.ts", newPath: "C:\\workspace\\shared\\new.flyde.ts" },
    ]), reference("../shared/new.flyde.ts"));
  });

  it("rejects invalid YAML, alias references and collisions without returning a partial rewrite", () => {
    const renames = [{ oldPath: "/workspace/flows/old.flyde", newPath: "/workspace/flows/new.flyde" }];
    assert.throws(() => updateFlowPathsForRenames("node: [", flowPath, renames), /invalid YAML/);
    assert.throws(() => updateFlowPathsForRenames("dependency: &dependency ./old.flyde\n" + reference("*dependency"), flowPath, renames), /aliased reference/);
    assert.throws(() => updateFlowPathsForRenames(reference('&dependency "./old.flyde"') + "unrelated: *dependency\n", flowPath, renames), /aliased reference/);
    assert.throws(() => updateFlowPathsForRenames("imports:\n  ./old.flyde: [Old]\n  ./new.flyde: [New]\nnode: {instances: []}\n", flowPath, renames), /import keys would collide/);
    assert.throws(() => updateFlowPathsForRenames(reference("./old.flyde"), flowPath, [
      ...renames,
      { oldPath: "/workspace/flows/other.flyde", newPath: "/workspace/flows/new.flyde" },
    ]), /colliding destinations/);
  });
});
