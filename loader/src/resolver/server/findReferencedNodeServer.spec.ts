import {
  AdvancedCodeNode,
  CodeNode,
  codeNodeInstance,
  visualNodeInstance,
} from "@flyde/core";
import { assert } from "chai";
import { join } from "path";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "fs";
import { tmpdir } from "os";
import { createServerReferencedNodeFinder } from "./findReferencedNodeServer";



describe("findReferencedNodeServer", () => {
  it("resolves custom editor component bundle paths for file nodes", async () => {
    const fixturePath = getFixturePath("custom-editor-component/flow.flyde");
    const instance = codeNodeInstance("Node", "Node", {
      type: "file",
      data: "Node.flyde.js",
    });

    const findReferencedNode = createServerReferencedNodeFinder(fixturePath);

    const node = findReferencedNode(instance);

    const editorConfig = (node as AdvancedCodeNode<any>)
      .editorConfig as { type: "custom"; editorComponentBundleContent: string };

    const contentOfCompJs = "// dummy component content for test";
    assert.equal(editorConfig.editorComponentBundleContent, contentOfCompJs);
  });

  it("resolves custom editor component bundle paths for built-in nodes", async () => {
    const fixturePath = getFixturePath("custom-editor-component/flow.flyde");
    const instance = codeNodeInstance("someInsId", "CodeExpression", {
      type: "package",
      data: "@flyde/nodes",
    });

    const findReferencedNode = createServerReferencedNodeFinder(fixturePath);

    const node = findReferencedNode(instance);

    const editorConfig = (node as AdvancedCodeNode<any>)
      .editorConfig as { type: "custom"; editorComponentBundleContent: string };

    assert.include(editorConfig.editorComponentBundleContent, "React"); // naive check
  });

  it("resolves custom editor component bundle paths for npm packages", async () => {
    const fixturePath = getFixturePath("custom-editor-component-package/flow.flyde");
    const instance = codeNodeInstance("someInsId", "Node", {
      type: "package",
      data: "@acme/custom-editor",
    });

    const findReferencedNode = createServerReferencedNodeFinder(fixturePath);

    const node = findReferencedNode(instance);

    const editorConfig = (node as AdvancedCodeNode<any>)
      .editorConfig as { type: "custom"; editorComponentBundleContent: string };

    assert.include(editorConfig.editorComponentBundleContent, "// dummy component content for test");
  });

  it("populates sourceCode for file nodes", async () => {
    const fixturePath = getFixturePath("a-imports-js-node-from-b/a.flyde");
    const instance = codeNodeInstance("someInsId", "Add", {
      type: "file",
      data: "Add.flyde.js",
    });

    const findReferencedNode = createServerReferencedNodeFinder(fixturePath);

    const node = findReferencedNode(instance) as CodeNode;

    assert.exists(node.sourceCode);
    assert.include(node.sourceCode, "inputs.a + 1");
  });

  it("populates sourceCode for package nodes", async () => {
    const fixturePath = getFixturePath("a-imports-b-code-from-stdlib/flow.flyde");
    const instance = codeNodeInstance("someInsId", "Add", {
      type: "package",
      data: "@flyde/nodes",
    });

    const findReferencedNode = createServerReferencedNodeFinder(fixturePath);

    const node = findReferencedNode(instance) as CodeNode;

    assert.exists(node.sourceCode);
    assert.include(node.sourceCode.toLowerCase(), "add");
  });

  it("resolves a moved local visual node by node id when the stored relative path is stale", async () => {
    const tempRoot = mkdtempSync(join(tmpdir(), "flyde-moved-node-"));

    try {
      const flowPath = join(tempRoot, "flow.flyde");
      const movedNodePath = join(tempRoot, "moved", "AddOne.flyde");

      mkdirSync(join(tempRoot, "moved"));
      writeFileSync(
        flowPath,
        "node:\n  id: Flow\n  inputs: {}\n  outputs: {}\n  instances: []\n  connections: []\n  inputsPosition: {}\n  outputsPosition: {}\n"
      );
      writeFileSync(
        movedNodePath,
        "node:\n  id: AddOne\n  inputs: {}\n  outputs: {}\n  instances: []\n  connections: []\n  inputsPosition: {}\n  outputsPosition: {}\n",
        { flag: "wx" }
      );

      const instance = visualNodeInstance("addOne", "AddOne", {
        type: "file",
        data: "./AddOne.flyde",
      });

      const findReferencedNode = createServerReferencedNodeFinder(flowPath);

      const node = findReferencedNode(instance);

      assert.equal(node.id, "AddOne");
    } finally {
      rmSync(tempRoot, { force: true, recursive: true });
    }
  });

});

function getFixturePath(path: string) {
  return join(__dirname, "../../fixture", path);
}
