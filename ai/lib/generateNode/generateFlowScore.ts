import { openai } from "@ai-sdk/openai";
import { anthropic } from "@ai-sdk/anthropic";
import { generateObject } from "ai";
import { z } from "zod";

const nodeGenerationPrompt = `You are a helpful visual backend api planner. You will be given a description for the logic of an HTTP request handler Your task is to:
1. assess how clear is the request from 0 to 100
2. A short follow-up question

Reply with JSON:
{"score": number, "followUpQuestion": string}
`;

export interface PlanFlowNodesResult {
  score: number;
  followUpQuestion: string;
  diagnostics: {
    duration: number;
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
    estimatedCost: number;
  };
}

export async function generateFlowScore(
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
        score: z.number(),
        followUpQuestion: z.string(),
      }),
    });

    const duration = Date.now() - startTime;

    const promptTokens = completion.usage?.promptTokens ?? 0;
    const completionTokens = completion.usage?.completionTokens ?? 0;
    const totalTokens = promptTokens + completionTokens;
    const estimatedCost =
      (promptTokens * 2.5 + completionTokens * 10.0) / 1_000_000;

    return {
      score: completion.object.score,
      followUpQuestion: completion.object.followUpQuestion,
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
