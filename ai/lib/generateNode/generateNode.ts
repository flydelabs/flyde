import { openai } from "@ai-sdk/openai";
import { THIS_INS_ID, TRIGGER_PIN_ID, VisualNode } from "@flyde/core";
import { generateObject, generateText } from "ai";
import { NextApiRequest, NextApiResponse } from "next";
import { z } from "zod";
import { SimpleNode } from "./simplifiedNode";
import { simpleToVisualNode } from "./simplifiedNode";
import { library } from "./simplifiedLibrary";

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

const nodeGenerationPrompt = `Create a Flyde visual node representing an HTTP request handler based on this description. Return ONLY valid JSON matching this type:

type Node = {
  nodes: Array<{ nodeId: string, id: string, config?: any, x: number, y: number }>,
  links: Array<{ from: [string, string], to: [string, string] }>
}

Available nodes:
${library.map((node) => JSON.stringify(node, null, 2)).join("\n")}

## Node configuration:
- nodes.config is the configuration of the node. It can be either static or dynamic, and should match the node's inputs schema
- To make it static, just pass the required value in the config
- To make it dynamic, use double curly braces. For example, {{value}}. It supports dot notation to access object data where it is available.
- The name of the dynamic value exposed becomes a new input in the node, which can be used to connect to other nodes

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

## User request:
{description}`;

export interface GenerateNodeResult {
  node: VisualNode;
  rawResponse: string;
}

export async function generateNode(
  description: string
): Promise<GenerateNodeResult> {
  try {
    const completion = await generateObject({
      model: openai("gpt-4o"),
      messages: [
        {
          role: "system",
          content: nodeGenerationPrompt.replace("{description}", description),
        },
        { role: "user", content: "Generate the node" },
      ],
      schema: z.object({
        nodes: z.array(
          z.object({
            nodeId: z.string(),
            id: z.string(),
            config: z.any(),
            x: z.number(),
            y: z.number(),
          })
        ),
        links: z.array(
          z.object({ from: z.array(z.string()), to: z.array(z.string()) })
        ),
      }),
    });

    console.log("## completion");
    console.log(JSON.stringify(completion.object, null, 2));

    const simpleNode = completion.object as SimpleNode;
    const visualNode = simpleToVisualNode(simpleNode);

    return {
      node: visualNode,
      rawResponse: JSON.stringify(completion.object, null, 2),
    };
  } catch (error) {
    console.error("Error generating node:", error);
    throw error;
  }
}
