import { strict as assert } from "assert";
import * as path from "path";
import { parse, stringify } from "yaml";
import { FileRename, getReferenceEditsForRename } from "./rename-references";

const flow = (data: string, type = "file") =>
  stringify({
    node: { instances: [{ type: "visual", source: { type, data } }] },
  });
const apply = (
  contents: string,
  file: string,
  renames: FileRename[],
  paths = path.posix
) => {
  const edits = getReferenceEditsForRename(contents, file, renames, paths);
  return edits
    .sort((a, b) => b.start - a.start)
    .reduce(
      (text, edit) =>
        text.slice(0, edit.start) + edit.text + text.slice(edit.end),
      contents
    );
};
const source = (text: string) => parse(text).node.instances[0].source.data;
const move = (oldPath: string, newPath: string): FileRename[] => [
  { oldPath, newPath },
];

describe("getReferenceEditsForRename", () => {
  it("updates a moved producer", () => {
    assert.equal(
      source(
        apply(
          flow("./Producer.flyde"),
          "/p/Consumer.flyde",
          move("/p/Producer.flyde", "/p/shared/Producer.flyde")
        )
      ),
      "./shared/Producer.flyde"
    );
  });
  it("rebases imports when only the consumer moves", () => {
    assert.equal(
      source(
        apply(
          flow("./Producer.flyde"),
          "/p/Consumer.flyde",
          move("/p/Consumer.flyde", "/p/sub/Consumer.flyde")
        )
      ),
      "../Producer.flyde"
    );
  });
  it("maps referenced descendants of a renamed folder", () => {
    assert.equal(
      source(
        apply(
          flow("./components/Producer.flyde"),
          "/p/Consumer.flyde",
          move("/p/components", "/p/shared")
        )
      ),
      "./shared/Producer.flyde"
    );
  });
  it("rebases consumers inside a moved folder", () => {
    assert.equal(
      source(
        apply(
          flow("../Producer.flyde"),
          "/p/flows/Consumer.flyde",
          move("/p/flows", "/p/deep/flows")
        )
      ),
      "../../Producer.flyde"
    );
  });
  it("preserves bytes when both endpoints move together", () => {
    const original = flow("./Producer.flyde");
    assert.equal(
      apply(original, "/p/flows/Consumer.flyde", move("/p/flows", "/p/shared")),
      original
    );
  });
  it("handles both endpoints moving independently", () => {
    assert.equal(
      source(
        apply(flow("./Producer.flyde"), "/p/Consumer.flyde", [
          ...move("/p/Consumer.flyde", "/p/flows/Consumer.flyde"),
          ...move("/p/Producer.flyde", "/p/shared/Producer.flyde"),
        ])
      ),
      "../shared/Producer.flyde"
    );
  });
  it("does not match directory-name prefixes", () => {
    const original = flow("./components-old/Producer.flyde");
    assert.equal(
      apply(original, "/p/Consumer.flyde", move("/p/components", "/p/shared")),
      original
    );
  });
  it("applies simultaneous renames once rather than chaining targets", () => {
    assert.equal(
      source(
        apply(flow("./A.flyde"), "/p/Consumer.flyde", [
          ...move("/p/A.flyde", "/p/B.flyde"),
          ...move("/p/B.flyde", "/p/C.flyde"),
        ])
      ),
      "./B.flyde"
    );
  });
  it("uses the most specific mapping for overlapping paths", () => {
    assert.equal(
      source(
        apply(flow("./components/Producer.flyde"), "/p/Consumer.flyde", [
          ...move("/p/components", "/p/shared"),
          ...move("/p/components/Producer.flyde", "/p/Special.flyde"),
        ])
      ),
      "./Special.flyde"
    );
  });
  it("preserves package and custom sources", () => {
    for (const type of ["package", "custom"]) {
      const original = flow("./Producer.flyde", type);
      assert.equal(
        apply(
          original,
          "/p/Consumer.flyde",
          move("/p/Producer.flyde", "/p/New.flyde")
        ),
        original
      );
    }
  });
  it("updates code sources and nested inline visual nodes", () => {
    const original = stringify({
      node: {
        instances: [
          {
            source: {
              type: "inline",
              data: {
                instances: [
                  {
                    type: "code",
                    source: { type: "file", data: "./Producer.flyde.ts" },
                  },
                ],
              },
            },
          },
        ],
      },
    });
    const result = parse(
      apply(
        original,
        "/p/Consumer.flyde",
        move("/p/Producer.flyde.ts", "/p/New.flyde.ts")
      )
    );
    assert.equal(
      result.node.instances[0].source.data.instances[0].source.data,
      "./New.flyde.ts"
    );
  });
  it("keeps comments, CRLF, formatting, and unrelated values", () => {
    const original =
      "# keep\r\nnode:\r\n  instances:\r\n    - source: {type: file, data: './Producer.flyde'} # note\r\nunknown: 001\r\n";
    const result = apply(
      original,
      "/p/Consumer.flyde",
      move("/p/Producer.flyde", "/p/New.flyde")
    );
    assert.equal(
      result,
      original.replace("'./Producer.flyde'", '"./New.flyde"')
    );
  });
  it("replaces a scalar alias locally without changing its anchor", () => {
    const original =
      "other: &path ./Producer.flyde\nnode:\n  instances:\n    - source: {type: file, data: *path}\n";
    const result = apply(
      original,
      "/p/Consumer.flyde",
      move("/p/Producer.flyde", "/p/New.flyde")
    );
    assert.equal(parse(result).other, "./Producer.flyde");
    assert.equal(source(result), "./New.flyde");
  });
  it("preserves an absolute reference when only its consumer moves", () => {
    const original = flow("/shared/Producer.flyde");
    assert.equal(
      apply(
        original,
        "/p/Consumer.flyde",
        move("/p/Consumer.flyde", "/p/sub/Consumer.flyde")
      ),
      original
    );
  });
  it("updates absolute references to moved producers", () => {
    assert.equal(
      source(
        apply(
          flow("/shared/Producer.flyde"),
          "/p/Consumer.flyde",
          move("/shared", "/new")
        )
      ),
      "/new/Producer.flyde"
    );
  });
  it("handles Windows paths and emits portable separators", () => {
    assert.equal(
      source(
        apply(
          flow(".\\Producer.flyde"),
          "C:\\p\\Consumer.flyde",
          move("C:\\p\\Consumer.flyde", "C:\\p\\sub\\Consumer.flyde"),
          path.win32
        )
      ),
      "../Producer.flyde"
    );
  });
  it("handles Windows cross-drive moves without inventing relative paths", () => {
    assert.equal(
      source(
        apply(
          flow("./Producer.flyde"),
          "C:\\p\\Consumer.flyde",
          move("C:\\p\\Producer.flyde", "D:\\shared\\Producer.flyde"),
          path.win32
        )
      ),
      "D:/shared/Producer.flyde"
    );
  });
  it("rejects invalid YAML without returning partial edits", () => {
    assert.throws(
      () =>
        getReferenceEditsForRename(
          "node: [",
          "/p/A.flyde",
          move("/p/A.flyde", "/p/B.flyde")
        ),
      /Invalid flow YAML/
    );
  });
  it("preserves block-scalar comments and the following YAML property", () => {
    for (const style of ["|-", ">-"]) {
      for (const eol of ["\n", "\r\n"]) {
        const original =
          `node:\n  instances:\n    - source:\n        type: file\n        data: ${style} # keep\n          ./Producer.flyde\nunknown: 001\n`.replace(
            /\n/g,
            eol
          );
        const result = apply(
          original,
          "/p/Consumer.flyde",
          move("/p/Producer.flyde", "/p/New.flyde")
        );
        assert.equal(source(result), "./New.flyde");
        assert.ok(result.includes(`# keep${eol}unknown: 001${eol}`));
      }
    }
  });
  it("rejects rewriting anchors that could affect unrelated data", () => {
    const original =
      "node:\n  instances:\n    - source: {type: file, data: &path ./Producer.flyde}\nother: *path\n";
    assert.throws(
      () =>
        apply(
          original,
          "/p/Consumer.flyde",
          move("/p/Producer.flyde", "/p/New.flyde")
        ),
      /anchored file reference/
    );
  });
  it("leaves unrelated renames and empty batches unchanged", () => {
    const original = flow("./Producer.flyde");
    assert.equal(
      apply(original, "/p/Consumer.flyde", move("/other", "/new")),
      original
    );
    assert.deepEqual(
      getReferenceEditsForRename(original, "/p/Consumer.flyde", []),
      []
    );
  });
});
