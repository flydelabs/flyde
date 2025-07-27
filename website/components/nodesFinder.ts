import { FlydeNode, isCodeNode } from "@flyde/core";
import type { ReferencedNodeFinder } from "@flyde/loader";

import * as stdLibBrowser from "@flyde/nodes/dist/all-browser";
import { OpenAIStub, AnthropicStub } from "./llm-stubs";
import { enhanceNodeWithUI } from "@/lib/browserNodesLibrary";
import { getNodeSource } from "@/lib/generated/node-sources";

export const websiteNodesFinder: ReferencedNodeFinder = (instance) => {
  const { type, source, nodeId } = instance;

  if (
    type === "code" &&
    source.type === "package" &&
    source.data === "@flyde/nodes"
  ) {
    // Use browser-compatible stubs for LLM nodes
    if (nodeId === "OpenAI") {
      return OpenAIStub;
    }
    if (nodeId === "Anthropic") {
      return AnthropicStub;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const maybeFromNodes = (stdLibBrowser as any)[nodeId] as FlydeNode;

    if (!maybeFromNodes) {
      throw new Error(`Cannot find node ${instance.nodeId} in "@flyde/nodes`);
    }

    const enhancedNode = enhanceNodeWithUI(maybeFromNodes) as FlydeNode;

    // Add sourceCode for stdlib nodes if it's a code node
    if (isCodeNode(enhancedNode)) {
      const sourceCode = getNodeSource(nodeId);
      if (sourceCode) {
        return {
          ...enhancedNode,
          sourceCode
        };
      }
    }

    return enhancedNode;
  }

  throw new Error(`Cannot find node ${instance.nodeId}`);
};

