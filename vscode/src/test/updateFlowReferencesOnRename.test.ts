import * as assert from "assert";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import * as sinon from "sinon";
import * as vscode from "vscode";
import { FlydeFlow } from "@flyde/core";
import { updateFlowReferencesOnRename } from "@flyde/loader";
import { deserializeFlow } from "@flyde/loader/dist/server";
import { resolveFlowServer } from "@flyde/loader/dist/resolver/server/resolveFlowServer";
import { updateFlowReferencesForRename } from "../updateFlowReferencesOnRename";

function createFlow(source: any): FlydeFlow {
  return {
    node: {
      id: "Parent",
      inputs: {},
      outputs: {},
      inputsPosition: {},
      outputsPosition: {},
      instances: [
        {
          id: "imported",
          nodeId: "Imported",
          type: "visual",
          source,
          inputConfig: {},
          pos: { x: 0, y: 0 },
        },
      ],
      connections: [],
    },
  };
}

function getFileSourceData(flow: FlydeFlow, instanceIndex = 0): string {
  const source = flow.node.instances[instanceIndex].source;
  if (!source || source.type !== "file") {
    throw new Error("Expected a file source");
  }
  return source.data;
}

suite("Flow rename references", () => {
  test("updates code and visual file imports after their target moves", () => {
    const visualFlow = createFlow({
      type: "file",
      data: "./nodes/Visual.flyde",
    });
    const codeFlow = createFlow({
      type: "file",
      data: "./nodes/Code.flyde.ts",
    });
    const renames = [
      {
        oldPath: "/workspace/nodes/Visual.flyde",
        newPath: "/workspace/shared/Visual.flyde",
      },
      {
        oldPath: "/workspace/nodes/Code.flyde.ts",
        newPath: "/workspace/shared/Code.flyde.ts",
      },
    ];

    assert(
      updateFlowReferencesOnRename(
        visualFlow,
        "/workspace/Parent.flyde",
        renames
      )
    );
    assert(
      updateFlowReferencesOnRename(
        codeFlow,
        "/workspace/Parent.flyde",
        renames
      )
    );
    assert.strictEqual(
      getFileSourceData(visualFlow),
      "./shared/Visual.flyde"
    );
    assert.strictEqual(
      getFileSourceData(codeFlow),
      "./shared/Code.flyde.ts"
    );
  });

  test("rebases imports when the referencing flow moves", () => {
    const flow = createFlow({ type: "file", data: "./Child.flyde" });

    assert(
      updateFlowReferencesOnRename(flow, "/workspace/flows/Parent.flyde", [
        {
          oldPath: "/workspace/Parent.flyde",
          newPath: "/workspace/flows/Parent.flyde",
        },
      ])
    );
    assert.strictEqual(getFileSourceData(flow), "../Child.flyde");
  });

  test("leaves package, self, and unrelated file references unchanged", () => {
    const flow = createFlow({ type: "package", data: "@flyde/nodes" });
    flow.node.instances.push({
      id: "self",
      nodeId: "Parent",
      type: "visual",
      source: { type: "self" },
      inputConfig: {},
      pos: { x: 0, y: 0 },
    });
    flow.node.instances.push({
      id: "unrelated",
      nodeId: "Other",
      type: "visual",
      source: { type: "file", data: "Other.flyde" },
      inputConfig: {},
      pos: { x: 0, y: 0 },
    });

    assert.strictEqual(
      updateFlowReferencesOnRename(flow, "/workspace/Parent.flyde", [
        {
          oldPath: "/workspace/Elsewhere.flyde",
          newPath: "/workspace/Moved.flyde",
        },
      ]),
      false
    );

    const packageSource = flow.node.instances[0].source;
    assert(packageSource && packageSource.type === "package");
    assert.strictEqual(packageSource.data, "@flyde/nodes");
    assert.strictEqual(flow.node.instances[1].source!.type, "self");
    assert.strictEqual(getFileSourceData(flow, 2), "Other.flyde");
  });

  test("updates a dirty document and keeps a moved code import resolvable", async () => {
    const testRoot = fs.mkdtempSync(
      path.join(os.tmpdir(), "flyde-rename-test-")
    );
    const nodesDirectory = path.join(testRoot, "nodes");
    const sharedDirectory = path.join(testRoot, "shared");
    const oldCodePath = path.join(nodesDirectory, "Increment.flyde.ts");
    const newCodePath = path.join(sharedDirectory, "Increment.flyde.ts");
    const parentPath = path.join(testRoot, "Parent.flyde");
    const parentUri = vscode.Uri.file(parentPath);
    let document: vscode.TextDocument | undefined;
    let findFilesStub: sinon.SinonStub | undefined;

    fs.mkdirSync(nodesDirectory);
    fs.mkdirSync(sharedDirectory);
    fs.writeFileSync(
      oldCodePath,
      `import { CodeNode } from "@flyde/core";
export const Increment: CodeNode = {
  id: "Increment",
  inputs: { value: { mode: "required" } },
  outputs: { result: {} },
  run: ({ value }, { result }) => result.next(value + 1),
};
`
    );
    fs.writeFileSync(
      parentPath,
      `imports: {}
node:
  id: Parent
  inputs: {}
  outputs: {}
  instances:
    - id: increment
      nodeId: Increment
      type: code
      source:
        type: file
        data: ./nodes/Increment.flyde.ts
      inputConfig: {}
      config: {}
      pos:
        x: 0
        y: 0
  connections: []
`
    );

    try {
      const initialFlow = deserializeFlow(
        fs.readFileSync(parentPath, "utf8"),
        parentPath
      );
      assert.doesNotThrow(() =>
        resolveFlowServer(initialFlow.node, parentPath)
      );

      document = await vscode.workspace.openTextDocument(parentUri);
      const metadataEdit = new vscode.WorkspaceEdit();
      const inputsOffset = document.getText().indexOf("  inputs: {}");
      metadataEdit.insert(
        parentUri,
        document.positionAt(inputsOffset),
        "  description: unsaved metadata\n"
      );
      assert(await vscode.workspace.applyEdit(metadataEdit));
      assert.strictEqual(document.isDirty, true);

      fs.renameSync(oldCodePath, newCodePath);
      findFilesStub = sinon
        .stub(vscode.workspace, "findFiles")
        .resolves([parentUri]);

      const rejectedEdit = sinon.stub(vscode.workspace, "applyEdit").resolves(false);
      try {
        await assert.rejects(updateFlowReferencesForRename([
          { oldPath: oldCodePath, newPath: newCodePath },
        ]), /Failed to update flow references/);
      } finally {
        rejectedEdit.restore();
      }

      await updateFlowReferencesForRename([
        { oldPath: oldCodePath, newPath: newCodePath },
      ]);

      assert.strictEqual(document.isDirty, true);
      assert(document.getText().includes("description: unsaved metadata"));
      assert(document.getText().includes("data: ./shared/Increment.flyde.ts"));

      const updatedFlow = deserializeFlow(document.getText(), parentPath);
      assert.doesNotThrow(() =>
        resolveFlowServer(updatedFlow.node, parentPath)
      );
    } finally {
      findFilesStub?.restore();
      if (document?.isDirty) {
        await document.save();
      }
      fs.rmSync(testRoot, { recursive: true, force: true });
    }
  });
});
