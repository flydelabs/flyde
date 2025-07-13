import { AdvancedCodeNode, FlydeNode } from "@flyde/core";
import { ReferencedNodeFinder } from "@flyde/loader/dist/resolver/ReferencedNodeFinder";
// import type { ReferencedNodeFinder } from "@flyde/loader";

import * as stdLibBrowser from "@flyde/nodes/dist/all-browser";

export const websiteNodesFinder: ReferencedNodeFinder = (instance) => {
  const { type, source, nodeId } = instance;

  if (
    type === "code" &&
    source.type === "package" &&
    source.data === "@flyde/stdlib"
  ) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const maybeFromStdlib = (stdLibBrowser as any)[nodeId] as FlydeNode;

    if (!maybeFromStdlib) {
      throw new Error(`Cannot find node ${instance.nodeId} in "@flyde/stdlib`);
    }
    const maybeAdvancedNode = maybeFromStdlib as AdvancedCodeNode<unknown>;

    if (maybeAdvancedNode.editorConfig?.type === "custom") {
      // const content = import("@flyde/stdlib/dist/bundled-config/" +
      //   instance.nodeId);
      // maybeAdvancedNode.editorConfig.editorComponentBundleContent = content;
    }

    return maybeFromStdlib as FlydeNode;
  }

  throw new Error(`Cannot find node ${instance.nodeId}`);
};