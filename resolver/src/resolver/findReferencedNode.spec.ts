import {
  codeNodeInstance,
  AdvancedCodeNode,
  MacroEditorConfigCustom,
  CodeNode
} from "@flyde/core";
import { assert } from "chai";
import { join } from "path";
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
      .editorConfig as MacroEditorConfigCustom;

    const contentOfCompJs = "// dummy component content for test";
    assert.equal(editorConfig.editorComponentBundleContent, contentOfCompJs);
  });

  it("resolves custom editor component bundle paths for build in stdlib nodes", async () => {
    const fixturePath = getFixturePath("custom-editor-component/flow.flyde");
    const instance = codeNodeInstance("someInsId", "InlineValue", {
      type: "package",
      data: "@flyde/stdlib",
    });

    const findReferencedNode = createServerReferencedNodeFinder(fixturePath);

    const node = findReferencedNode(instance);

    const editorConfig = (node as AdvancedCodeNode<any>)
      .editorConfig as MacroEditorConfigCustom;

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
      .editorConfig as MacroEditorConfigCustom;

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
      data: "@flyde/stdlib",
    });

    const findReferencedNode = createServerReferencedNodeFinder(fixturePath);

    const node = findReferencedNode(instance) as CodeNode;

    assert.exists(node.sourceCode);
    assert.include(node.sourceCode.toLowerCase(), "add");
  });

 
});

function getFixturePath(path: string) {
  return join(__dirname, "../../fixture", path);
}
