import { strict as assert } from "assert";
import * as path from "path";
import { parse, stringify } from "yaml";
import { FileRename, getReferenceEditsForRename } from "./rename-references";

const flowYaml = (data: string, type = "file") =>
  stringify({
    node: { instances: [{ type: "visual", source: { type, data } }] },
  });

function applyEdits(
  contents: string,
  file: string,
  renames: FileRename[],
  paths: typeof path.posix = path.posix
): string {
  const edits = getReferenceEditsForRename(contents, file, renames, paths);
  return edits
    .sort((a, b) => b.start - a.start)
    .reduce(
      (text, edit) => text.slice(0, edit.start) + edit.text + text.slice(edit.end),
      contents
    );
}

const readSource = (text: string) => parse(text).node.instances[0].source.data;
const rename = (oldPath: string, newPath: string): FileRename[] => [
  { oldPath, newPath },
];

describe("getReferenceEditsForRename", () => {
  it("rewrites when the imported producer file moves", () => {
    assert.equal(
      readSource(
        applyEdits(
          flowYaml("./Producer.flyde"),
          "/p/Consumer.flyde",
          rename("/p/Producer.flyde", "/p/shared/Producer.flyde")
        )
      ),
      "./shared/Producer.flyde"
    );
  });

  it("rebases relative imports when only the consumer moves", () => {
    assert.equal(
      readSource(
        applyEdits(
          flowYaml("./Producer.flyde"),
          "/p/Consumer.flyde",
          rename("/p/Consumer.flyde", "/p/sub/Consumer.flyde")
        )
      ),
      "../Producer.flyde"
    );
  });

  it("maps descendants when a folder is renamed", () => {
    assert.equal(
      readSource(
        applyEdits(
          flowYaml("./components/Producer.flyde"),
          "/p/Consumer.flyde",
          rename("/p/components", "/p/shared")
        )
      ),
      "./shared/Producer.flyde"
    );
  });

  it("rebases consumers living inside a moved folder", () => {
    assert.equal(
      readSource(
        applyEdits(
          flowYaml("../Producer.flyde"),
          "/p/flows/Consumer.flyde",
          rename("/p/flows", "/p/deep/flows")
        )
      ),
      "../../Producer.flyde"
    );
  });

  it("leaves bytes unchanged when producer and consumer move together", () => {
    const original = flowYaml("./Producer.flyde");
    assert.equal(
      applyEdits(original, "/p/flows/Consumer.flyde", rename("/p/flows", "/p/shared")),
      original
    );
  });

  it("handles independent producer and consumer moves in one batch", () => {
    assert.equal(
      readSource(
        applyEdits(flowYaml("./Producer.flyde"), "/p/Consumer.flyde", [
          ...rename("/p/Consumer.flyde", "/p/flows/Consumer.flyde"),
          ...rename("/p/Producer.flyde", "/p/shared/Producer.flyde"),
        ])
      ),
      "../shared/Producer.flyde"
    );
  });

  it("does not treat directory-name prefixes as descendants", () => {
    const original = flowYaml("./components-old/Producer.flyde");
    assert.equal(
      applyEdits(original, "/p/Consumer.flyde", rename("/p/components", "/p/shared")),
      original
    );
  });

  it("applies simultaneous renames without chaining targets", () => {
    assert.equal(
      readSource(
        applyEdits(flowYaml("./A.flyde"), "/p/Consumer.flyde", [
          ...rename("/p/A.flyde", "/p/B.flyde"),
          ...rename("/p/B.flyde", "/p/C.flyde"),
        ])
      ),
      "./B.flyde"
    );
  });

  it("prefers the most specific mapping when paths overlap", () => {
    assert.equal(
      readSource(
        applyEdits(flowYaml("./components/Producer.flyde"), "/p/Consumer.flyde", [
          ...rename("/p/components", "/p/shared"),
          ...rename("/p/components/Producer.flyde", "/p/Special.flyde"),
        ])
      ),
      "./Special.flyde"
    );
  });

  it("leaves package and custom sources untouched", () => {
    for (const type of ["package", "custom"]) {
      const original = flowYaml("./Producer.flyde", type);
      assert.equal(
        applyEdits(
          original,
          "/p/Consumer.flyde",
          rename("/p/Producer.flyde", "/p/New.flyde")
        ),
        original
      );
    }
  });

  it("updates nested inline visual file sources", () => {
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
      applyEdits(
        original,
        "/p/Consumer.flyde",
        rename("/p/Producer.flyde.ts", "/p/New.flyde.ts")
      )
    );
    assert.equal(
      result.node.instances[0].source.data.instances[0].source.data,
      "./New.flyde.ts"
    );
  });

  it("preserves comments, CRLF, formatting, and unrelated values", () => {
    const original =
      "# keep\r\nnode:\r\n  instances:\r\n    - source: {type: file, data: './Producer.flyde'} # note\r\nunknown: 001\r\n";
    const result = applyEdits(
      original,
      "/p/Consumer.flyde",
      rename("/p/Producer.flyde", "/p/New.flyde")
    );
    assert.equal(result, original.replace("'./Producer.flyde'", '"./New.flyde"'));
  });

  it("rewrites a scalar alias locally without mutating its anchor", () => {
    const original =
      "other: &path ./Producer.flyde\nnode:\n  instances:\n    - source: {type: file, data: *path}\n";
    const result = applyEdits(
      original,
      "/p/Consumer.flyde",
      rename("/p/Producer.flyde", "/p/New.flyde")
    );
    assert.equal(parse(result).other, "./Producer.flyde");
    assert.equal(readSource(result), "./New.flyde");
  });

  it("keeps absolute references when only the consumer moves", () => {
    const original = flowYaml("/shared/Producer.flyde");
    assert.equal(
      applyEdits(
        original,
        "/p/Consumer.flyde",
        rename("/p/Consumer.flyde", "/p/sub/Consumer.flyde")
      ),
      original
    );
  });

  it("updates absolute references when the producer moves", () => {
    assert.equal(
      readSource(
        applyEdits(
          flowYaml("/shared/Producer.flyde"),
          "/p/Consumer.flyde",
          rename("/shared", "/new")
        )
      ),
      "/new/Producer.flyde"
    );
  });

  it("handles Windows paths and emits portable separators", () => {
    assert.equal(
      readSource(
        applyEdits(
          flowYaml(".\\Producer.flyde"),
          "C:\\p\\Consumer.flyde",
          rename("C:\\p\\Consumer.flyde", "C:\\p\\sub\\Consumer.flyde"),
          path.win32
        )
      ),
      "../Producer.flyde"
    );
  });

  it("uses an absolute path on Windows cross-drive moves", () => {
    assert.equal(
      readSource(
        applyEdits(
          flowYaml("./Producer.flyde"),
          "C:\\p\\Consumer.flyde",
          rename("C:\\p\\Producer.flyde", "D:\\shared\\Producer.flyde"),
          path.win32
        )
      ),
      "D:/shared/Producer.flyde"
    );
  });

  it("rejects invalid YAML instead of returning partial edits", () => {
    assert.throws(
      () =>
        getReferenceEditsForRename(
          "node: [",
          "/p/A.flyde",
          rename("/p/A.flyde", "/p/B.flyde")
        ),
      /Invalid flow YAML/
    );
  });

  it("preserves block-scalar comments and the following property", () => {
    for (const style of ["|-", ">-"]) {
      for (const eol of ["\n", "\r\n"]) {
        const original =
          `node:\n  instances:\n    - source:\n        type: file\n        data: ${style} # keep\n          ./Producer.flyde\nunknown: 001\n`.replace(
            /\n/g,
            eol
          );
        const result = applyEdits(
          original,
          "/p/Consumer.flyde",
          rename("/p/Producer.flyde", "/p/New.flyde")
        );
        assert.equal(readSource(result), "./New.flyde");
        assert.ok(result.includes(`# keep${eol}unknown: 001${eol}`));
      }
    }
  });

  it("refuses to rewrite anchors that could affect unrelated data", () => {
    const original =
      "node:\n  instances:\n    - source: {type: file, data: &path ./Producer.flyde}\nother: *path\n";
    assert.throws(
      () =>
        applyEdits(
          original,
          "/p/Consumer.flyde",
          rename("/p/Producer.flyde", "/p/New.flyde")
        ),
      /anchored file reference/
    );
  });

  it("no-ops for unrelated renames and empty batches", () => {
    const original = flowYaml("./Producer.flyde");
    assert.equal(
      applyEdits(original, "/p/Consumer.flyde", rename("/other", "/new")),
      original
    );
    assert.deepEqual(
      getReferenceEditsForRename(original, "/p/Consumer.flyde", []),
      []
    );
  });
});
