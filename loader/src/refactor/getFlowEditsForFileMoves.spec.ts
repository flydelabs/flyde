import { codeNodeInstance, VisualNodeInstance } from "@flyde/core";
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
import * as path from "path";
import { createServerReferencedNodeFinder } from "../resolver/server/findReferencedNodeServer";
import { deserializeFlow, deserializeFlowByPath, serializeFlow } from "../serdes";
import {
  FileMove,
  FlowTextEdit,
  getFlowEditsForFileMoves,
} from "./getFlowEditsForFileMoves";

const { posix, win32 } = path;

function applyEdits(content: string, edits: FlowTextEdit[]): string {
  return [...edits]
    .sort((a, b) => b.start - a.start)
    .reduce(
      (text, { start, end, newText }) =>
        text.slice(0, start) + newText + text.slice(end),
      content
    );
}

function moveFlowFiles(
  content: string,
  flowPath: string,
  moves: FileMove[],
  pathModule: path.PlatformPath = posix
): string {
  return applyEdits(
    content,
    getFlowEditsForFileMoves(content, flowPath, moves, pathModule)
  );
}

function sourcesOf(content: string): unknown[] {
  return deserializeFlow(content, "test.flyde").node.instances.map(
    (instance) => instance.source
  );
}

function visualInstance(
  id: string,
  source: VisualNodeInstance["source"]
): VisualNodeInstance {
  return {
    id,
    type: "visual",
    nodeId: id,
    source,
    inputConfig: {},
    pos: { x: 0, y: 0 },
  };
}

function flowImporting(...instances: Array<VisualNodeInstance | ReturnType<typeof codeNodeInstance>>): string {
  return serializeFlow({
    node: {
      id: "Parent",
      inputs: {},
      outputs: {},
      inputsPosition: {},
      outputsPosition: {},
      connections: [],
      instances,
    },
  });
}

const importsChild = (data: string) =>
  flowImporting(visualInstance("Child", { type: "file", data }));

describe("getFlowEditsForFileMoves", () => {
  describe("moving an imported file", () => {
    it("points the import at the file's new location", () => {
      const result = moveFlowFiles(importsChild("./Child.flyde"), "/ws/flows/Parent.flyde", [
        { oldPath: "/ws/flows/Child.flyde", newPath: "/ws/shared/Child.flyde" },
      ]);

      assert.deepEqual(sourcesOf(result), [
        { type: "file", data: "../shared/Child.flyde" },
      ]);
    });

    it("follows a rename within the same folder", () => {
      const result = moveFlowFiles(importsChild("./Child.flyde"), "/ws/Parent.flyde", [
        { oldPath: "/ws/Child.flyde", newPath: "/ws/Kid.flyde" },
      ]);

      assert.deepEqual(sourcesOf(result), [{ type: "file", data: "./Kid.flyde" }]);
    });

    it("follows imports into a moved folder", () => {
      const result = moveFlowFiles(
        importsChild("../nodes/Child.flyde"),
        "/ws/flows/Parent.flyde",
        [{ oldPath: "/ws/nodes", newPath: "/ws/lib/nodes" }]
      );

      assert.deepEqual(sourcesOf(result), [
        { type: "file", data: "../lib/nodes/Child.flyde" },
      ]);
    });

    it("updates code node imports", () => {
      const content = flowImporting(
        codeNodeInstance("Add", "Add", { type: "file", data: "Add.flyde.ts" })
      );

      const result = moveFlowFiles(content, "/ws/Parent.flyde", [
        { oldPath: "/ws/Add.flyde.ts", newPath: "/ws/nodes/Add.flyde.ts" },
      ]);

      assert.deepEqual(sourcesOf(result), [
        { type: "file", data: "nodes/Add.flyde.ts" },
      ]);
    });

    it("updates relative package imports and leaves package names alone", () => {
      const content = flowImporting(
        codeNodeInstance("Custom", "Custom", { type: "package", data: "./custom.ts" }),
        codeNodeInstance("Value", "InlineValue", { type: "package", data: "@flyde/nodes" })
      );

      const result = moveFlowFiles(content, "/ws/Parent.flyde", [
        { oldPath: "/ws/custom.ts", newPath: "/ws/lib/custom.ts" },
      ]);

      assert.deepEqual(sourcesOf(result), [
        { type: "package", data: "./lib/custom.ts" },
        { type: "package", data: "@flyde/nodes" },
      ]);
    });

    it("updates imports inside inline visual nodes", () => {
      const inlineNode = {
        id: "Inline",
        inputs: {},
        outputs: {},
        connections: [],
        instances: [visualInstance("Child", { type: "file", data: "./Child.flyde" })],
      };
      const content = flowImporting(
        visualInstance("Inline", { type: "inline", data: inlineNode as any })
      );

      const result = moveFlowFiles(content, "/ws/Parent.flyde", [
        { oldPath: "/ws/Child.flyde", newPath: "/ws/shared/Child.flyde" },
      ]);

      const [inline] = deserializeFlow(result, "test.flyde").node.instances as any[];
      assert.deepEqual(inline.source.data.instances[0].source, {
        type: "file",
        data: "./shared/Child.flyde",
      });
    });
  });

  describe("moving the importing flow", () => {
    it("keeps its imports pointing at the same files", () => {
      const result = moveFlowFiles(
        importsChild("./Child.flyde"),
        "/ws/flows/nested/Parent.flyde",
        [{ oldPath: "/ws/flows/Parent.flyde", newPath: "/ws/flows/nested/Parent.flyde" }]
      );

      assert.deepEqual(sourcesOf(result), [{ type: "file", data: "../Child.flyde" }]);
    });

    it("keeps imports working when the flow's folder moves", () => {
      const result = moveFlowFiles(
        importsChild("../nodes/Child.flyde"),
        "/ws/src/flows/Parent.flyde",
        [{ oldPath: "/ws/flows", newPath: "/ws/src/flows" }]
      );

      assert.deepEqual(sourcesOf(result), [
        { type: "file", data: "../../nodes/Child.flyde" },
      ]);
    });

    it("leaves imports untouched when the import moves along with the flow", () => {
      const content = importsChild("./Child.flyde");

      const edits = getFlowEditsForFileMoves(content, "/ws/app/Parent.flyde", [
        { oldPath: "/ws/flows", newPath: "/ws/app" },
      ], posix);

      assert.deepEqual(edits, []);
    });

    it("resolves several moves from a single operation", () => {
      const result = moveFlowFiles(importsChild("./Child.flyde"), "/ws/b/Parent.flyde", [
        { oldPath: "/ws/a/Parent.flyde", newPath: "/ws/b/Parent.flyde" },
        { oldPath: "/ws/a/Child.flyde", newPath: "/ws/c/Child.flyde" },
      ]);

      assert.deepEqual(sourcesOf(result), [{ type: "file", data: "../c/Child.flyde" }]);
    });
  });

  describe("output", () => {
    it("replaces only the import path, preserving formatting, comments and line endings", () => {
      const content = [
        "# Parent flow",
        "imports: {}",
        "node:",
        "  instances:",
        "    - id: Child # the child",
        "      nodeId: Child",
        "      type: visual",
        "      source:",
        "        type: file",
        "        data: './Child.flyde' # keep me",
        "      pos: {x: 1, y: 2}",
        "  connections: []",
        "  id: Parent",
        "  inputs: {}",
        "  outputs: {}",
        "",
      ].join("\r\n");

      const result = moveFlowFiles(content, "/ws/Parent.flyde", [
        { oldPath: "/ws/Child.flyde", newPath: "/ws/shared/Child.flyde" },
      ]);

      assert.equal(
        result,
        content.replace("'./Child.flyde'", "'./shared/Child.flyde'")
      );
    });

    it("keeps a leading ./ only when the original import had one", () => {
      const moves = [{ oldPath: "/ws/Child.flyde", newPath: "/ws/sub/Child.flyde" }];

      assert.deepEqual(sourcesOf(moveFlowFiles(importsChild("./Child.flyde"), "/ws/P.flyde", moves)), [
        { type: "file", data: "./sub/Child.flyde" },
      ]);
      assert.deepEqual(sourcesOf(moveFlowFiles(importsChild("Child.flyde"), "/ws/P.flyde", moves)), [
        { type: "file", data: "sub/Child.flyde" },
      ]);
    });

    it("quotes paths that are not valid plain YAML scalars", () => {
      const result = moveFlowFiles(importsChild("Child.flyde"), "/ws/Parent.flyde", [
        { oldPath: "/ws/Child.flyde", newPath: "/ws/@shared/Child.flyde" },
      ]);

      assert.include(result, '"@shared/Child.flyde"');
      assert.deepEqual(sourcesOf(result), [{ type: "file", data: "@shared/Child.flyde" }]);
    });

    it("quotes paths containing flow indicators inside flow mappings", () => {
      const content = [
        "node:",
        "  id: Parent",
        "  inputs: {}",
        "  outputs: {}",
        "  connections: []",
        "  instances:",
        "    - { id: Child, nodeId: Child, type: visual, source: { type: file, data: ./Child.flyde } }",
        "",
      ].join("\n");

      const result = moveFlowFiles(content, "/ws/Parent.flyde", [
        { oldPath: "/ws/Child.flyde", newPath: "/ws/a,b/Child.flyde" },
      ]);

      assert.deepEqual(sourcesOf(result), [{ type: "file", data: "./a,b/Child.flyde" }]);
    });

    it("writes forward-slash paths on Windows", () => {
      const result = moveFlowFiles(
        importsChild(".\\nodes\\Child.flyde"),
        "C:\\ws\\flows\\Parent.flyde",
        [{ oldPath: "C:\\ws\\flows\\nodes", newPath: "C:\\ws\\flows\\lib\\nodes" }],
        win32
      );

      assert.deepEqual(sourcesOf(result), [
        { type: "file", data: "./lib/nodes/Child.flyde" },
      ]);
    });
  });

  describe("no-ops", () => {
    it("returns no edits for unrelated moves", () => {
      const edits = getFlowEditsForFileMoves(importsChild("./Child.flyde"), "/ws/Parent.flyde", [
        { oldPath: "/ws/README.md", newPath: "/ws/docs/README.md" },
        { oldPath: "/ws/Child.flyde.bak", newPath: "/ws/Child.flyde.old" },
      ], posix);

      assert.deepEqual(edits, []);
    });

    it("returns no edits for sibling folders sharing a name prefix", () => {
      const edits = getFlowEditsForFileMoves(importsChild("./nodes-extra/Child.flyde"), "/ws/Parent.flyde", [
        { oldPath: "/ws/nodes", newPath: "/ws/lib" },
      ], posix);

      assert.deepEqual(edits, []);
    });

    it("returns no edits for flows that are not valid YAML", () => {
      const edits = getFlowEditsForFileMoves("node: [Child.flyde", "/ws/flows/Parent.flyde", [
        { oldPath: "/ws/Parent.flyde", newPath: "/ws/flows/Parent.flyde" },
      ], posix);

      assert.deepEqual(edits, []);
    });

    it("skips imports that can no longer be expressed as a relative path", () => {
      const edits = getFlowEditsForFileMoves(
        importsChild("./Child.flyde"),
        "C:\\ws\\Parent.flyde",
        [{ oldPath: "C:\\ws\\Child.flyde", newPath: "D:\\shared\\Child.flyde" }],
        win32
      );

      assert.deepEqual(edits, []);
    });
  });

  describe("with the loader", () => {
    let root: string;

    beforeEach(() => {
      root = mkdtempSync(path.join(tmpdir(), "flyde-file-moves-"));
      mkdirSync(path.join(root, "flows"));
      mkdirSync(path.join(root, "shared"));
      writeFileSync(
        path.join(root, "flows", "Child.flyde"),
        serializeFlow({
          node: {
            id: "Child",
            inputs: {},
            outputs: {},
            inputsPosition: {},
            outputsPosition: {},
            instances: [],
            connections: [],
          },
        })
      );
      writeFileSync(path.join(root, "flows", "Parent.flyde"), importsChild("./Child.flyde"));
    });

    afterEach(() => {
      rmSync(root, { recursive: true, force: true });
    });

    function resolveChildOf(parentPath: string) {
      const [instance] = deserializeFlowByPath(parentPath).node.instances;
      return createServerReferencedNodeFinder(parentPath)(instance);
    }

    function move(moves: FileMove[], flowPath: string) {
      moves.forEach(({ oldPath, newPath }) => renameSync(oldPath, newPath));
      const content = readFileSync(flowPath, "utf8");
      writeFileSync(flowPath, applyEdits(content, getFlowEditsForFileMoves(content, flowPath, moves)));
    }

    it("resolves the imported flow after it moves", () => {
      const parentPath = path.join(root, "flows", "Parent.flyde");

      move(
        [{ oldPath: path.join(root, "flows", "Child.flyde"), newPath: path.join(root, "shared", "Child.flyde") }],
        parentPath
      );

      assert.equal(resolveChildOf(parentPath).id, "Child");
    });

    it("resolves the imported flow after the importing flow moves", () => {
      const parentPath = path.join(root, "shared", "Parent.flyde");

      move(
        [{ oldPath: path.join(root, "flows", "Parent.flyde"), newPath: parentPath }],
        parentPath
      );

      assert.equal(resolveChildOf(parentPath).id, "Child");
    });
  });
});
