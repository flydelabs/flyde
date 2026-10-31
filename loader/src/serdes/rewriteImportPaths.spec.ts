import { assert } from "chai";
import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  renameSync,
  rmSync,
  writeFileSync,
} from "fs";
import { tmpdir } from "os";
import { join, posix, win32 } from "path";
import * as yaml from "yaml";
import { resolveFlowByPath } from "../resolver/server/resolveFlowServer";
import {
  mapPathThroughMoves,
  mapPathThroughMovesBackwards,
  rewriteImportPathsAfterMove,
} from "./rewriteImportPaths";

const flowWithFileImport = (id: string, importPath: string) => `node:
  id: ${id}
  inputs: {}
  outputs: {}
  instances:
    - id: childInst
      nodeId: Child
      inputConfig: {}
      pos:
        x: 0
        y: 0
      source:
        type: file
        data: ${JSON.stringify(importPath)}
      type: visual
  connections: []
  inputsPosition: {}
  outputsPosition: {}
`;

const childFlow = `node:
  id: Child
  inputs: {}
  outputs: {}
  instances: []
  connections: []
  inputsPosition: {}
  outputsPosition: {}
`;

const readImportedPath = (flowContents: string) => {
  const flow = yaml.parse(flowContents);
  return flow.node.instances[0].source.data as string;
};

const withTempDir = (fn: (dir: string) => void) => {
  const dir = mkdtempSync(join(tmpdir(), "flyde-move-imports-"));
  try {
    fn(dir);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
};

describe("rewriteImportPathsAfterMove", () => {
  it("keeps imports resolving after the imported flow moves to another folder", () => {
    withTempDir((dir) => {
      const flowsDir = join(dir, "flows");
      const libDir = join(dir, "lib");
      const otherDir = join(dir, "other");
      [flowsDir, libDir, otherDir].forEach((folder) => mkdirSync(folder));

      const mainPath = join(flowsDir, "main.flyde");
      const oldChildPath = join(libDir, "child.flyde");
      const newChildPath = join(otherDir, "child.flyde");

      writeFileSync(mainPath, flowWithFileImport("Main", "../lib/child.flyde"));
      writeFileSync(oldChildPath, childFlow);

      assert.equal(resolveFlowByPath(mainPath).id, "Main");

      renameSync(oldChildPath, newChildPath);
      assert.throws(() => resolveFlowByPath(mainPath));

      const updated = rewriteImportPathsAfterMove(readFileSync(mainPath, "utf8"), {
        flowBefore: mainPath,
        flowAfter: mainPath,
        moves: [{ from: oldChildPath, to: newChildPath }],
      });

      writeFileSync(mainPath, updated);

      assert.equal(readImportedPath(updated), "../other/child.flyde");
      assert.equal(resolveFlowByPath(mainPath).id, "Main");
    });
  });

  it("rebases outgoing imports when the flow itself moves", () => {
    withTempDir((dir) => {
      const flowsDir = join(dir, "flows");
      const libDir = join(dir, "lib");
      const nestedDir = join(flowsDir, "nested");
      [flowsDir, libDir, nestedDir].forEach((folder) => mkdirSync(folder));

      const oldMainPath = join(flowsDir, "main.flyde");
      const newMainPath = join(nestedDir, "main.flyde");
      const childPath = join(libDir, "child.flyde");

      writeFileSync(oldMainPath, flowWithFileImport("Main", "../lib/child.flyde"));
      writeFileSync(childPath, childFlow);

      renameSync(oldMainPath, newMainPath);

      const updated = rewriteImportPathsAfterMove(readFileSync(newMainPath, "utf8"), {
        flowBefore: oldMainPath,
        flowAfter: newMainPath,
        moves: [{ from: oldMainPath, to: newMainPath }],
      });

      writeFileSync(newMainPath, updated);

      assert.equal(readImportedPath(updated), "../../lib/child.flyde");
      assert.equal(resolveFlowByPath(newMainPath).id, "Main");
    });
  });

  it("rewrites imports when a parent folder moves", () => {
    withTempDir((dir) => {
      const flowsDir = join(dir, "flows");
      const libDir = join(dir, "lib");
      const libsDir = join(dir, "libs");
      [flowsDir, libDir].forEach((folder) => mkdirSync(folder));

      const mainPath = join(flowsDir, "main.flyde");
      writeFileSync(mainPath, flowWithFileImport("Main", "../lib/child.flyde"));
      writeFileSync(join(libDir, "child.flyde"), childFlow);

      renameSync(libDir, libsDir);

      const updated = rewriteImportPathsAfterMove(readFileSync(mainPath, "utf8"), {
        flowBefore: mainPath,
        flowAfter: mainPath,
        moves: [{ from: libDir, to: libsDir }],
      });

      writeFileSync(mainPath, updated);

      assert.equal(readImportedPath(updated), "../libs/child.flyde");
      assert.equal(resolveFlowByPath(mainPath).id, "Main");
    });
  });

  it("rewrites imports of moved code node files", () => {
    const contents = flowWithFileImport("Main", "../lib/Child.flyde.ts");
    const updated = rewriteImportPathsAfterMove(contents, {
      flowBefore: "/ws/flows/main.flyde",
      flowAfter: "/ws/flows/main.flyde",
      moves: [
        {
          from: "/ws/lib/Child.flyde.ts",
          to: "/ws/nodes/Child.flyde.ts",
        },
      ],
      pathImpl: posix,
    });

    assert.equal(readImportedPath(updated), "../nodes/Child.flyde.ts");
  });

  it("rewrites absolute import paths when the imported file moves", () => {
    const contents = flowWithFileImport("Main", "/ws/lib/child.flyde");
    const updated = rewriteImportPathsAfterMove(contents, {
      flowBefore: "/ws/flows/main.flyde",
      flowAfter: "/ws/flows/main.flyde",
      moves: [{ from: "/ws/lib/child.flyde", to: "/ws/other/child.flyde" }],
      pathImpl: posix,
    });

    assert.equal(readImportedPath(updated), "/ws/other/child.flyde");
  });

  it("handles Windows paths and separators", () => {
    const contents = flowWithFileImport("Main", "..\\lib\\child.flyde");
    const updated = rewriteImportPathsAfterMove(contents, {
      flowBefore: "C:\\ws\\flows\\main.flyde",
      flowAfter: "C:\\ws\\flows\\main.flyde",
      moves: [{ from: "C:\\ws\\lib", to: "C:\\ws\\libs" }],
      pathImpl: win32,
    });

    assert.equal(readImportedPath(updated), "..\\libs\\child.flyde");
  });

  it("preserves comments", () => {
    const contents = `# flow comment\n${flowWithFileImport(
      "Main",
      "../lib/child.flyde"
    )}`;
    const updated = rewriteImportPathsAfterMove(contents, {
      flowBefore: "/ws/flows/main.flyde",
      flowAfter: "/ws/flows/main.flyde",
      moves: [{ from: "/ws/lib/child.flyde", to: "/ws/other/child.flyde" }],
      pathImpl: posix,
    });

    assert.include(updated, "# flow comment");
    assert.equal(readImportedPath(updated), "../other/child.flyde");
  });

  it("returns the original contents when no import is affected", () => {
    const contents = flowWithFileImport("Main", "../lib/child.flyde");
    const updated = rewriteImportPathsAfterMove(contents, {
      flowBefore: "/ws/flows/main.flyde",
      flowAfter: "/ws/flows/main.flyde",
      moves: [{ from: "/ws/lib/unrelated.flyde", to: "/ws/other/unrelated.flyde" }],
      pathImpl: posix,
    });

    assert.strictEqual(updated, contents);
  });

  it("does not normalize paths for unrelated moves", () => {
    const contents = flowWithFileImport("Main", "./child.flyde");
    const updated = rewriteImportPathsAfterMove(contents, {
      flowBefore: "/ws/flows/main.flyde",
      flowAfter: "/ws/flows/main.flyde",
      moves: [{ from: "/ws/lib/unrelated.flyde", to: "/ws/other/unrelated.flyde" }],
      pathImpl: posix,
    });

    assert.strictEqual(updated, contents);
  });

  it("rewrites imports inside inline flows", () => {
    const contents = `node:
  instances:
    - id: inlineInst
      nodeId: Inline
      source:
        type: inline
        data:
          instances:
            - id: childInst
              nodeId: Child
              source:
                type: file
                data: ../lib/child.flyde
  connections: []
`;
    const updated = rewriteImportPathsAfterMove(contents, {
      flowBefore: "/ws/flows/main.flyde",
      flowAfter: "/ws/flows/main.flyde",
      moves: [{ from: "/ws/lib/child.flyde", to: "/ws/other/child.flyde" }],
      pathImpl: posix,
    });

    const flow = yaml.parse(updated);
    assert.equal(
      flow.node.instances[0].source.data.instances[0].source.data,
      "../other/child.flyde"
    );
  });

  it("keeps anchors and aliases valid", () => {
    const contents = `node:
  instances:
    - source: {type: file, data: &child ../lib/child.flyde}
    - source: {type: file, data: *child}
`;
    const updated = rewriteImportPathsAfterMove(contents, {
      flowBefore: "/ws/flows/main.flyde",
      flowAfter: "/ws/flows/main.flyde",
      moves: [{ from: "/ws/lib/child.flyde", to: "/ws/other/child.flyde" }],
      pathImpl: posix,
    });

    const flow = yaml.parse(updated);
    assert.equal(flow.node.instances[0].source.data, "../other/child.flyde");
    assert.equal(flow.node.instances[1].source.data, "../other/child.flyde");
    assert.include(updated, "&child");
  });

  it("does not touch cross-drive moves on Windows", () => {
    const contents = flowWithFileImport("Main", "..\\lib\\child.flyde");
    const updated = rewriteImportPathsAfterMove(contents, {
      flowBefore: "C:\\ws\\flows\\main.flyde",
      flowAfter: "C:\\ws\\flows\\main.flyde",
      moves: [{ from: "C:\\ws\\lib\\child.flyde", to: "D:\\other\\child.flyde" }],
      pathImpl: win32,
    });

    assert.strictEqual(updated, contents);
  });

  it("rewrites legacy imports keys", () => {
    const contents = `imports:
  "../lib/child.flyde": Child
node:
  id: Main
  instances:
    - id: childInst
      nodeId: Child
  connections: []
`;
    const updated = rewriteImportPathsAfterMove(contents, {
      flowBefore: "/ws/flows/main.flyde",
      flowAfter: "/ws/flows/main.flyde",
      moves: [{ from: "/ws/lib/child.flyde", to: "/ws/other/child.flyde" }],
      pathImpl: posix,
    });

    const flow = yaml.parse(updated);
    assert.deepEqual(Object.keys(flow.imports), ["../other/child.flyde"]);
    assert.equal(flow.imports["../other/child.flyde"], "Child");
  });

  it("keeps legacy package imports when the flow moves", () => {
    const contents = `imports:
  "@flyde/nodes": Add
  "../lib/child.flyde": Child
node:
  id: Main
  instances:
    - id: addInst
      nodeId: Add
    - id: childInst
      nodeId: Child
  connections: []
`;
    const updated = rewriteImportPathsAfterMove(contents, {
      flowBefore: "/ws/main.flyde",
      flowAfter: "/ws/nested/main.flyde",
      moves: [{ from: "/ws/main.flyde", to: "/ws/nested/main.flyde" }],
      pathImpl: posix,
    });

    const flow = yaml.parse(updated);
    assert.equal(flow.imports["@flyde/nodes"], "Add");
    assert.equal(flow.imports["../../lib/child.flyde"], "Child");
  });

  it("resolves aliases whose anchor is defined outside the import", () => {
    const contents = `node:
  instances:
    - id: childInst
      nodeId: Child
      config:
        path: &childPath ../lib/child.flyde
      source:
        type: file
        data: *childPath
`;
    const updated = rewriteImportPathsAfterMove(contents, {
      flowBefore: "/ws/flows/main.flyde",
      flowAfter: "/ws/flows/main.flyde",
      moves: [{ from: "/ws/lib/child.flyde", to: "/ws/other/child.flyde" }],
      pathImpl: posix,
    });

    const flow = yaml.parse(updated);
    assert.equal(
      flow.node.instances[0].source.data,
      "../other/child.flyde"
    );
    assert.equal(
      flow.node.instances[0].config.path,
      "../other/child.flyde"
    );
  });

  it("rewrites an aliased import only once when the flow moves", () => {
    const contents = `node:
  instances:
    - source: {type: file, data: &child ../lib/child.flyde}
    - source: {type: file, data: *child}
`;
    const updated = rewriteImportPathsAfterMove(contents, {
      flowBefore: "/ws/flows/main.flyde",
      flowAfter: "/ws/flows/nested/main.flyde",
      moves: [
        { from: "/ws/flows/main.flyde", to: "/ws/flows/nested/main.flyde" },
      ],
      pathImpl: posix,
    });

    const flow = yaml.parse(updated);
    assert.equal(flow.node.instances[0].source.data, "../../lib/child.flyde");
    assert.equal(flow.node.instances[1].source.data, "../../lib/child.flyde");
  });

  it("composes chained moves for imported files", () => {
    const contents = flowWithFileImport("Main", "../lib/child.flyde");
    const updated = rewriteImportPathsAfterMove(contents, {
      flowBefore: "/ws/flows/main.flyde",
      flowAfter: "/ws/flows/main.flyde",
      moves: [
        { from: "/ws/lib", to: "/ws/libs" },
        { from: "/ws/libs", to: "/ws/vendor" },
      ],
      pathImpl: posix,
    });

    assert.equal(readImportedPath(updated), "../vendor/child.flyde");
  });

  it("composes chained moves when the flow itself moves", () => {
    const contents = flowWithFileImport("Main", "../lib/child.flyde");
    const updated = rewriteImportPathsAfterMove(contents, {
      flowBefore: "/ws/flows/main.flyde",
      flowAfter: "/ws/a/b/main.flyde",
      moves: [
        { from: "/ws/flows/main.flyde", to: "/ws/a/main.flyde" },
        { from: "/ws/a/main.flyde", to: "/ws/a/b/main.flyde" },
      ],
      pathImpl: posix,
    });

    assert.equal(readImportedPath(updated), "../../lib/child.flyde");
  });

  it("rewrites legacy keys that collide only with not yet rewritten keys", () => {
    const contents = `imports:
  "nested/b.flyde": Nested
  "b.flyde": Root
node:
  id: Main
  instances:
    - id: nestedInst
      nodeId: Nested
    - id: rootInst
      nodeId: Root
  connections: []
`;
    const updated = rewriteImportPathsAfterMove(contents, {
      flowBefore: "/ws/main.flyde",
      flowAfter: "/ws/nested/main.flyde",
      moves: [{ from: "/ws/main.flyde", to: "/ws/nested/main.flyde" }],
      pathImpl: posix,
    });

    const flow = yaml.parse(updated);
    assert.deepEqual(Object.keys(flow.imports).sort(), [
      "../b.flyde",
      "b.flyde",
    ]);
    assert.equal(flow.imports["b.flyde"], "Nested");
    assert.equal(flow.imports["../b.flyde"], "Root");
  });

  it("never creates duplicate keys when legacy targets collide", () => {
    const contents = `imports:
  nested/b.flyde.ts: Nested
  b.flyde.ts: One
  ./b.flyde.ts: Two
node:
  id: Main
  instances:
    - id: nestedInst
      nodeId: Nested
    - id: oneInst
      nodeId: One
    - id: twoInst
      nodeId: Two
  connections: []
`;
    const updated = rewriteImportPathsAfterMove(contents, {
      flowBefore: "/ws/main.flyde",
      flowAfter: "/ws/nested/main.flyde",
      moves: [{ from: "/ws/main.flyde", to: "/ws/nested/main.flyde" }],
      pathImpl: posix,
    });

    const flow = yaml.parse(updated);
    const keys = Object.keys(flow.imports);

    assert.equal(new Set(keys).size, keys.length);
    assert.equal(keys.length, 3);
  });

  it("distinguishes parent traversal from names starting with two dots", () => {
    const moves = [{ from: "/ws/lib", to: "/ws/libs" }];

    assert.equal(
      mapPathThroughMoves("/ws/lib/..hidden/child.flyde", moves, posix),
      "/ws/libs/..hidden/child.flyde"
    );
    assert.equal(
      mapPathThroughMoves("/ws/lib/../other/child.flyde", moves, posix),
      "/ws/lib/../other/child.flyde"
    );
  });
});

describe("moved path helpers", () => {
  it("maps files inside a moved folder to their new location", () => {
    const mapped = mapPathThroughMoves(
      "C:\\ws\\lib\\child.flyde",
      [{ from: "C:\\ws\\lib", to: "C:\\ws\\libs" }],
      win32
    );

    assert.equal(mapped, "C:\\ws\\libs\\child.flyde");
  });

  it("maps files inside a moved folder back to their previous location", () => {
    const mapped = mapPathThroughMovesBackwards(
      "C:\\ws\\libs\\child.flyde",
      [{ from: "C:\\ws\\lib", to: "C:\\ws\\libs" }],
      win32
    );

    assert.equal(mapped, "C:\\ws\\lib\\child.flyde");
  });

  it("walks a chained move back to the original location", () => {
    const mapped = mapPathThroughMovesBackwards(
      "/ws/vendor/child.flyde",
      [
        { from: "/ws/lib", to: "/ws/libs" },
        { from: "/ws/libs", to: "/ws/vendor" },
      ],
      posix
    );

    assert.equal(mapped, "/ws/lib/child.flyde");
  });
});
