import {
  CodeNode,
  ImportableSource,
  ImportedNode,
  RunNodeFunction,
  randomInt,
} from "@flyde/core";
import { resolveCodeNodeDependencies } from "@flyde/resolver";
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

  console.log({ code, functionBody });

  return { code, fileName };
}

export async function generateAndSaveNode(
  rootDir: string,
  prompt: string,
  apiKey?: string
): Promise<ImportableSource> {
  const { fileName, code } = await generateNode(prompt);

  console.log({ fileName, code });
  let filePath = join(rootDir, `${fileName}.flyde.ts`);
  if (existsSync(filePath)) {
    filePath = filePath.replace(/\.flyde\.ts$/, `${randomInt(9999)}.flyde.ts`);
  }

  writeFileSync(filePath, code);
  const maybeNode = resolveCodeNodeDependencies(filePath).parts[0];
  if (!maybeNode) {
    throw new Error("Generated part is corrupt");
  }

  const part: ImportedNode = {
    ...maybeNode.part,
    source: { path: filePath, export: maybeNode.exportName },
  };
  return { part, module: `./${fileName}.flyde.ts` };
}
