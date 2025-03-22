import { AdvancedCodeNode, FlydeNode } from "@flyde/core";
import type { ReferencedNodeFinder } from "@flyde/resolver/dist/resolver/findReferencedNode/ReferencedNodeFinder";

import * as stdLibBrowser from "@flyde/stdlib/dist/all-browser";

export const websiteNodesFinder: ReferencedNodeFinder = (instance) => {
  const { type, source, nodeId } = instance;

  if (
    type === "code" &&
    source.type === "package" &&
    source.data === "@flyde/stdlib"
  ) {
    const maybeFromStdlib = stdLibBrowser[nodeId];

    if (!maybeFromStdlib) {
      throw new Error(`Cannot find node ${instance.nodeId} in "@flyde/stdlib`);
    }
    const maybeAdvancedNode = maybeFromStdlib as AdvancedCodeNode<any>;

    if (maybeAdvancedNode.editorConfig?.type === "custom") {
      const content = require("@flyde/stdlib/dist/bundled-config/" +
        instance.nodeId);
      maybeAdvancedNode.editorConfig.editorComponentBundleContent = content;
    }

    return maybeFromStdlib as FlydeNode;
  }
};
