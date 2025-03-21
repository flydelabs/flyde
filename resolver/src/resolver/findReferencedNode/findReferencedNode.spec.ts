import { codeNodeInstance, AdvancedCodeNode, MacroEditorConfigCustom } from "@flyde/core";
import { assert } from "chai";
import { join } from "path";
import { createServerReferencedNodeFinder } from "./findReferencedNodeServer";
import { readFileSync } from "fs";

describe("findReferencedNodeServer", () => {
    it("resolves custom editor component bundle paths", async () => {
      const fixturePath = getFixturePath("custom-editor-component/flow.flyde");
      const instance = codeNodeInstance("Node", "Node", {
        type: "file",
        data: 'Node.flyde.js'
      });

      const findReferencedNode = createServerReferencedNodeFinder(fixturePath);
      
      const node = findReferencedNode(instance);

      const editorConfig = (node as AdvancedCodeNode<any>).editorConfig as MacroEditorConfigCustom;
      assert.equal(editorConfig.editorComponentBundlePath, join(fixturePath, '..', 'comp.js'));
      assert.equal(editorConfig.editorComponentBundleContent, readFileSync(editorConfig.editorComponentBundlePath, 'utf-8'));
    });
  });


  function getFixturePath(path: string) {
    return join(__dirname, "../../../fixture", path);
  }