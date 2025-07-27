import { FlydeNode } from "@flyde/core";
import type { ReferencedNodeFinder } from "@flyde/loader";

import * as stdLibBrowser from "@flyde/nodes/dist/all-browser";
import { OpenAIStub, AnthropicStub } from "./llm-stubs";
import { enhanceNodeWithUI } from "@/lib/browserNodesLibrary";

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

    return enhanceNodeWithUI(maybeFromNodes) as FlydeNode;
  }

  throw new Error(`Cannot find node ${instance.nodeId}`);
};

