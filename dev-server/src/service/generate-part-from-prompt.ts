import {
  CodePart,
  ImportableSource,
  ImportedPart,
  RunPartFunction,
  randomInt,
} from "@flyde/core";
import { resolveCodePartDependencies } from "@flyde/resolver";
import axios from "axios";
import { existsSync, writeFileSync } from "fs";

import { join } from "path";

async function generatePart(
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
import { CodePart } from "@flyde/runtime";



const rawInputs: string = "${inputs}";
const rawOutputs: string = "${outputs}";
const rawCompletionOutputs: string = "${completionOutputs}";
const rawReactiveInputs: string = "${reactiveInputs}";

export const Part: CodePart = {
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

export async function generateAndSavePart(
  rootDir: string,
  prompt: string,
  apiKey?: string
): Promise<ImportableSource> {
  const { fileName, code } = await generatePart(prompt);

  console.log({ fileName, code });
  let filePath = join(rootDir, `${fileName}.flyde.ts`);
  if (existsSync(filePath)) {
    filePath = filePath.replace(/\.flyde\.ts$/, `${randomInt(9999)}.flyde.ts`);
  }

  writeFileSync(filePath, code);
  const maybePart = resolveCodePartDependencies(filePath).parts[0];
  if (!maybePart) {
    throw new Error("Generated part is corrupt");
  }

  const part: ImportedPart = {
    ...maybePart.part,
    source: { path: filePath, export: maybePart.exportName },
  };
  return { part, module: `./${fileName}.flyde.ts` };
}
