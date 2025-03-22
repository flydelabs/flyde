import { CodeNode, randomInt } from "@flyde/core";
import { resolveCodeNodeDependencies } from "@flyde/resolver";
import { existsSync, writeFileSync } from "fs";

import OpenAI from "openai";

import { join } from "path";
import { generateCustomNodePrompt } from "./prompts";

async function generateNode(
  prompt: string,
  apiKey: string
): Promise<{ code: string; fileName: string }> {
  const openai = new OpenAI({
    apiKey,
  });

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      { role: "system", content: generateCustomNodePrompt },
      { role: "user", content: prompt },
    ],
  });

  const code = response.choices[0].message.content;
  const usage = response.usage?.total_tokens ?? -1;

  console.info(`Flyde node generation used a total of ${usage} tokens`);

  const nodeId = code.match(/export const (\w+)/)?.[1];

  const fileName = nodeId?.replace(/([a-z])([A-Z])/g, "$1-$2").toLowerCase();

  return { code, fileName };
}

export async function generateAndSaveNode(
  rootDir: string,
  prompt: string,
  apiKey: string
): Promise<any> {
  const { fileName, code } = await generateNode(prompt, apiKey);

  let filePath = join(rootDir, `${fileName}.flyde.ts`);
  if (existsSync(filePath)) {
    filePath = filePath.replace(/\.flyde\.ts$/, `${randomInt(9999)}.flyde.ts`);
  }

  writeFileSync(filePath, code);
  const maybeNode = resolveCodeNodeDependencies(filePath).nodes[0];
  if (!maybeNode) {
    throw new Error("Generated node is corrupt");
  }

  const node = {
    ...(maybeNode.node as CodeNode),
    source: { path: filePath, export: maybeNode.exportName },
  };
  return { node, module: `./${fileName}.flyde.ts` };
}
