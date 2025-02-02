import { openai } from "@ai-sdk/openai";
import { anthropic } from "@ai-sdk/anthropic";
import { VisualNode } from "@flyde/core";
import { generateObject } from "ai";
import { z } from "zod";
import { SimpleNode } from "./simplifiedNode";
import { simpleToVisualNode } from "./simplifiedNode";
import { library } from "./simplifiedLibrary";

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

const nodeGenerationPrompt = `Create a Flyde visual node representing an HTTP request handler based on this description. Return ONLY valid JSON matching this type:

type Node = {
  nodes: Array<{ nodeId: string, id: string, config?: any, dynamicInputs: string[], x: number, y: number }>,
  links: Array<{ from: [string, string], to: [string, string] }>
}

Also return an "explanation" field, which you should start with, which contains the nodes you will be using and how to configure them

Available nodes:
${library.map((node) => JSON.stringify(node, null, 2)).join("\n")}

## Node configuration:
- nodes.config is the configuration of the node. It can be either static or dynamic, and should match the node's inputs schema
- To make it static, just pass the required value in the config
- To make it dynamic, use double curly braces. For example, {{value}}. It supports dot notation to access object data where it is available.
- The name of the dynamic value exposed becomes a new input in the node, which can be used to connect to other nodes
- Any dynamic value you use should be returned in the nodes.dynamicInputs array

### Examples:
- To use the "InlineValue" node, you can pass the value in the config. For example, {{nodeId: "InlineValue", config: {value: "Hello {{user.name"}}

## Links:
- Each link is a link from a node's input to another node's output
- The link is an array of two elements, the first is the id and the second is the input/output name

## Rules:
- Always use the "request" node to get the request data and the "response" node to get the response data
- The node id is a unique identifier for the node instance
- The nodeId is the node's id in the library
- Always ensure the response node is connected to some value
- Make sure all exposed inputs (via {{value}}) are connected to another node
- Multiple connections to the same node are allowed
- Assume nodes are 200px wide and 100px high

## Order of operations:
1. Read the description and understand the requirements
2. Understand the available nodes and their inputs/outputs
3. Understand which configuration is needed for each node
4. Understand what dynamic values are needed for each node
5. Understand what links are needed for each node
6. For nodes without inputs, make sure to trigger them manually using the "__trigger" input via another node
7. Generate the node

## Examples:

### Example 1:
Description: "An API that returns an hardcoded greeting"

Result:
{
  "nodes": [
    { "nodeId": "request", id: "request", "config": { }, "dynamicInputs": []},
    { "nodeId": "InlineValue", id: "greeting", "config": { "value": "Carpe Diem, my friend!" }, "dynamicInputs": [] },
    { "nodeId": "response", id: "res", "config": { }, "dynamicInputs": ["data"] }
  ],
  "links": [
    { "from": ["request", "data"], "to": ["greeting", "__trigger"] },
    { "from": ["greeting", "value"], "to": ["res", "data"] }
  ]
}

Explanation:
- The InlineValue node is used to return a hardcoded value
- The InlineValue node doesn't have any inputs, so we need to trigger it manually using the "__trigger" input via another node
- The response node is connected to the InlineValue node's output

### Example 2:
Description: "An API that greets the user - the request query param 'name' is the user's name"

Result:
{
  "nodes": [
    { "nodeId": "request", id: "request", "config": { }, "dynamicInputs": []},
    { "nodeId": "InlineValue", id: "greeting", "config": { "value": "Hello, {{req.query.name}}!" }, "dynamicInputs": ["req"] },
    { "nodeId": "response", id: "res", "config": { }, "dynamicInputs": ["data"] }
  ],
  "links": [
    { "from": ["request", "data"], "to": ["greeting", "req"] },
    { "from": ["greeting", "value"], "to": ["res", "data"] }
  ]
}

Explanation:
- Request node contains the request data
- Because InlineValue has a dynamic value of "req" in the config, it becomes an input of the node.
- The response node is connected to the InlineValue node's output

### Example 3:
Description: "An API that does an HTTP request to 'example.com' and delays the response by 1 second"

Result:
{
  "nodes": [
    { "nodeId": "request", id: "request", "config": { }, "dynamicInputs": []},
    { "nodeId": "Http", id: "httpReq", "config": { "url": "https://example.com", "method": "GET" }, "dynamicInputs": ["data"] },
    { "nodeId": "Delay", id: "delay", "config": { "delayMs": 1000, "value": "{{valueToDelay}}" }, "dynamicInputs": ["valueToDelay"] },
    { "nodeId": "response", id: "res", "config": { }, "dynamicInputs": ["data"] }
  ],
  "links": [
    { "from": ["request", "data"], "to": ["httpReq", "__trigger"] },
    { "from": ["httpReq", "response"], "to": ["delay", "valueToDelay"] },
    { "from": ["delay", "delayedValue"], "to": ["res", "data"] }
  ]
}
Explanation:
- The HTTP node doesn't have any inputs, so we need to trigger it manually using the "__trigger" input
- To expose a dynamic value from the delay, we use the "Delay" node with a dynamic value of "{{valueToDelay}}"
- We could have chosen any other name and it would have worked the same as long as the name is used in the links


## User request:
{description}`;

export interface GenerateNodeResult {
  node: VisualNode;
  rawResponse: string;
  diagnostics: {
    duration: number;
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
    estimatedCost: number;
  };
}

export async function generateNode(
  description: string,
  model: "gpt-4o" | "claude-3-5-sonnet" | "o3-mini"
): Promise<GenerateNodeResult> {
  try {
    const startTime = Date.now();

    const modelToUse = (() => {
      if (model === "claude-3-5-sonnet") {
        return anthropic("claude-3-5-sonnet-20241022");
      }
      if (model === "o3-mini") {
        return openai("o3-mini");
      }
      return openai("gpt-4o");
    })();

    const completion = await generateObject({
      model: modelToUse,
      temperature: 0.5,
      messages: [
        {
          role: "system",
          content: nodeGenerationPrompt,
        },
        { role: "user", content: description },
      ],
      schema: z.object({
        explanation: z.string(),
        nodes: z.array(
          z.object({
            nodeId: z.string(),
            id: z.string(),
            config: z.any(),
            x: z.number(),
            y: z.number(),
            dynamicInputs: z.array(z.string()),
          })
        ),
        links: z.array(
          z.object({ from: z.array(z.string()), to: z.array(z.string()) })
        ),
      }),
    });

    const duration = Date.now() - startTime;

    // GPT-4 pricing:
    // Input: $2.50 per 1M tokens ($0.0025 per token)
    // Output: $10.00 per 1M tokens ($0.01 per token)
    const promptTokens = completion.usage?.promptTokens ?? 0;
    const completionTokens = completion.usage?.completionTokens ?? 0;
    const totalTokens = promptTokens + completionTokens;
    const estimatedCost =
      (promptTokens * 2.5 + completionTokens * 10.0) / 1_000_000;

    console.log("## Diagnostics", {
      duration,
      promptTokens,
      completionTokens,
      totalTokens,
      estimatedCost,
    });

    const simpleNode = completion.object as SimpleNode & {
      explanation: string;
    };
    const visualNode = simpleToVisualNode(simpleNode);

    return {
      node: visualNode,
      rawResponse: JSON.stringify(completion.object, null, 2),
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
