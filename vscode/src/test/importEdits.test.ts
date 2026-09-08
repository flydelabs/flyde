import * as assert from "assert";
import * as path from "path";
import { parse } from "yaml";
import { FileMove, getImportEdits } from "../importEdits";

const flow =
  "# keep this comment\r\nnode:\r\n  instances:\r\n    - source: {type: file, data: './Child.flyde'} # child\r\n      config: {message: untouched}\r\n";

function rewrite(
  text: string,
  file: string,
  moves: FileMove[],
  paths = path.posix,
): string {
  return getImportEdits(text, file, moves, paths)
    .sort((a, b) => b.start - a.start)
    .reduce(
      (result, edit) =>
        result.slice(0, edit.start) + edit.text + result.slice(edit.end),
      text,
    );
}

function reference(text: string): string {
  return parse(text).node.instances[0].source.data;
}

suite("Flyde import edits", () => {
  test("updates imported files and preserves surrounding bytes", () => {
    const result = rewrite(flow, "/project/Parent.flyde", [
      {
        oldPath: "/project/Child.flyde",
        newPath: "/project/shared/Child.flyde",
      },
    ]);
    assert.strictEqual(
      result,
      flow.replace("'./Child.flyde'", '"./shared/Child.flyde"'),
    );
  });

  test("updates imports inside a moved flow", () => {
    assert.strictEqual(
      reference(
        rewrite(flow, "/project/Parent.flyde", [
          {
            oldPath: "/project/Parent.flyde",
            newPath: "/project/nested/Parent.flyde",
          },
        ]),
      ),
      "../Child.flyde",
    );
  });

  test("moving a whole folder together keeps internal references unchanged", () => {
    assert.deepStrictEqual(
      getImportEdits(
        flow,
        "/project/flows/Parent.flyde",
        [{ oldPath: "/project/flows", newPath: "/project/renamed" }],
        path.posix,
      ),
      [],
    );
  });

  test("updates references to descendants of a moved folder", () => {
    const text = flow.replace("./Child.flyde", "./nodes/nested/Child.flyde");
    assert.strictEqual(
      reference(
        rewrite(text, "/project/Parent.flyde", [
          { oldPath: "/project/nodes", newPath: "/project/shared" },
        ]),
      ),
      "./shared/nested/Child.flyde",
    );
  });

  test("folder names must match a path boundary", () => {
    assert.strictEqual(
      rewrite(flow, "/project/flows-extra/Parent.flyde", [
        { oldPath: "/project/flows", newPath: "/project/shared" },
      ]),
      flow,
    );
  });

  test("batch moves are simultaneous and do not cascade", () => {
    const moves = [
      { oldPath: "/project/Child.flyde", newPath: "/project/Other.flyde" },
      { oldPath: "/project/Other.flyde", newPath: "/project/Child.flyde" },
      {
        oldPath: "/project/Parent.flyde",
        newPath: "/project/flows/Parent.flyde",
      },
    ];
    assert.strictEqual(
      reference(rewrite(flow, "/project/Parent.flyde", moves)),
      "../Other.flyde",
    );
  });

  test("handles Windows paths and emits portable import separators", () => {
    assert.strictEqual(
      reference(
        rewrite(
          flow,
          "C:\\project\\Parent.flyde",
          [
            {
              oldPath: "C:\\project\\Child.flyde",
              newPath: "C:\\project\\nodes\\Child.flyde",
            },
          ],
          path.win32,
        ),
      ),
      "./nodes/Child.flyde",
    );
  });

  test("handles an imported file moving to another Windows drive", () => {
    assert.strictEqual(
      reference(
        rewrite(
          flow,
          "C:\\project\\Parent.flyde",
          [
            {
              oldPath: "C:\\project\\Child.flyde",
              newPath: "D:\\shared\\Child.flyde",
            },
          ],
          path.win32,
        ),
      ),
      "D:/shared/Child.flyde",
    );
  });

  test("rewrites nested inline nodes without touching config or package data", () => {
    const text = `node:
  instances:
    - source:
        type: inline
        data:
          instances:
            - source: {type: file, data: ./Child.flyde}
    - source: {type: package, data: ./Child.flyde}
      config: {source: {type: file, data: ./Child.flyde}}
`;
    const result = parse(
      rewrite(text, "/project/Parent.flyde", [
        { oldPath: "/project/Child.flyde", newPath: "/project/Renamed.flyde" },
      ]),
    );
    assert.strictEqual(
      result.node.instances[0].source.data.instances[0].source.data,
      "./Renamed.flyde",
    );
    assert.strictEqual(result.node.instances[1].source.data, "./Child.flyde");
    assert.strictEqual(
      result.node.instances[1].config.source.data,
      "./Child.flyde",
    );
  });

  test("supports legacy import maps and code-node files", () => {
    const text =
      "imports:\n  ./Child.flyde.ts: [Child]\n  '@flyde/nodes': [Add]\nnode: {}\n";
    const result = parse(
      rewrite(text, "/project/Parent.flyde", [
        {
          oldPath: "/project/Child.flyde.ts",
          newPath: "/project/Code.flyde.ts",
        },
      ]),
    );
    assert.deepStrictEqual(result.imports, {
      "./Code.flyde.ts": ["Child"],
      "@flyde/nodes": ["Add"],
    });
  });

  test("invalid YAML is rejected without producing edits", () => {
    assert.throws(() =>
      getImportEdits("node: [", "/project/Parent.flyde", [], path.posix),
    );
  });
});
