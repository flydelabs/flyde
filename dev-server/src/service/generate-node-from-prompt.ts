import {
  CodeNode,
  ImportableSource,
  ImportedNode,
  randomInt,
} from "@flyde/core";
import { resolveCodeNodeDependencies, resolveFlow } from "@flyde/resolver";
import axios from "axios";
import { existsSync, writeFileSync } from "fs";

import { join } from "path";

async function generateNode(
  prompt: string
): Promise<{ code: string; fileName: string }> {
  const { tokensUsed, response } = (
    await axios.post("https://api.flyde.dev/generate", { prompt })
  ).data;

  const [metadata, ...functionBody] = response.split("\n");
  const [rawId, inputs, outputs, completionOutputs, reactiveInputs] = metadata
    .split("|")
    .map((s) => s.trim());

  const id = rawId.replace(/id:?\s*/i, "");
  const code = `
import { CodeNode } from "@flyde/runtime";



const rawInputs: string = "${inputs}";
const rawOutputs: string = "${outputs}";
const rawCompletionOutputs: string = "${completionOutputs}";
const rawReactiveInputs: string = "${reactiveInputs}";

export const Node: CodeNode = {
  id: "${id}",
  inputs: (rawInputs ? rawInputs.split(",") : []).reduce<Record<string, {}>>((acc, curr) => {
    acc[curr.trim()] = {};
    return acc;
  }, {}),
  outputs: (rawOutputs ? rawOutputs.split(",") : []).reduce<Record<string, {}>>((acc, curr) => {
    acc[curr.trim()] = {};
    return acc;
  }, {}),
  completionOutputs: rawCompletionOutputs === "IMPLICIT" ? undefined : rawCompletionOutputs.split(","),
  reactiveInputs: rawReactiveInputs === "NONE" ? undefined : rawReactiveInputs.split(","),
  run: ${functionBody.join("\n")}
}; 
`;

  const fileName = id.replace(/[^a-zA-Z0-9]/g, "-").toLowerCase();

  return { code, fileName };
}

export async function generateAndSaveNode(
  rootDir: string,
  prompt: string,
  apiKey?: string
): Promise<ImportableSource> {
  const { fileName, code } = await generateNode(prompt);

  let filePath = join(rootDir, `${fileName}.flyde.ts`);
  if (existsSync(filePath)) {
    filePath = filePath.replace(/\.flyde\.ts$/, `${randomInt(9999)}.flyde.ts`);
  }

  writeFileSync(filePath, code);
  const maybeNode = resolveCodeNodeDependencies(filePath).nodes[0];
  if (!maybeNode) {
    throw new Error("Generated node is corrupt");
  }

  const node: ImportedNode = {
    ...(maybeNode.node as CodeNode),
    source: { path: filePath, export: maybeNode.exportName },
  };
  return { node, module: `./${fileName}.flyde.ts` };
}
