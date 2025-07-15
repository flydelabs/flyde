import { AdvancedCodeNode, FlydeNode } from "@flyde/core";
import type { ReferencedNodeFinder } from "@flyde/loader";

import * as stdLibBrowser from "@flyde/nodes/dist/all-browser";
import { OpenAIStub, AnthropicStub } from "./llm-stubs";

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
    const maybeAdvancedNode = maybeFromNodes as AdvancedCodeNode<unknown>;

    if (maybeAdvancedNode.editorConfig?.type === "custom") {
      // Skip loading bundled config in browser environment
      // This disables custom UI components but allows the node to function
      console.warn(`Skipping custom UI for node ${instance.nodeId} in browser environment`);
    }

    return maybeFromNodes as FlydeNode;
  }

  throw new Error(`Cannot find node ${instance.nodeId}`);
};