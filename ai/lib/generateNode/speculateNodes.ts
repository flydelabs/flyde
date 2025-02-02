import { openai } from "@ai-sdk/openai";
import { anthropic } from "@ai-sdk/anthropic";
import { VisualNode } from "@flyde/core";
import { generateObject } from "ai";
import { z } from "zod";
import { SimpleNode } from "./simplifiedNode";
import { simpleToVisualNode } from "./simplifiedNode";
import { library } from "./simplifiedLibrary";

const nodeGenerationPrompt = `Flyde is a visual flow-based programming language. Each node is like a standalone function with configuration. Configuration can dynamic or static. Nodes can be used more than once.

You are a helpful flyde-based backend api planner. You will be given a description for the logic of an HTTP request handler Your task is to speculate which nodes will be required. Assume "RequestData" and "SendResponse" are always present.
Available nodes are: ${library.map((node) => node.id).join(", ")}

Reply with JSON:
{"nodes": string[]}
`;

export interface PlanFlowNodesResult {
  nodes: string[];
  diagnostics: {
    duration: number;
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
    estimatedCost: number;
  };
}

export async function planFlowNodes(
  description: string,
  model: "gpt-4o" | "claude-3-5-sonnet"
): Promise<PlanFlowNodesResult> {
  try {
    const startTime = Date.now();

    const completion = await generateObject({
      model:
        model === "gpt-4o"
          ? openai("gpt-4o")
          : anthropic("claude-3-5-sonnet-20241022"),
      temperature: 0.5,
      messages: [
        {
          role: "system",
          content: nodeGenerationPrompt,
        },
        { role: "user", content: description },
      ],
      schema: z.object({
        nodes: z.array(z.string()),
      }),
    });

    const duration = Date.now() - startTime;

    const promptTokens = completion.usage?.promptTokens ?? 0;
    const completionTokens = completion.usage?.completionTokens ?? 0;
    const totalTokens = promptTokens + completionTokens;
    const estimatedCost =
      (promptTokens * 2.5 + completionTokens * 10.0) / 1_000_000;

    return {
      nodes: completion.object.nodes,
      diagnostics: {
        duration,
        promptTokens,
        completionTokens,
        totalTokens,
        estimatedCost,
      },
    };
  } catch (error) {
    console.error("Error generating node:", error);
    throw error;
  }
}
