import {
  CodePart,
  ImportableSource,
  ImportedPart,
  randomInt,
} from "@flyde/core";
import { resolveCodePartDependencies } from "@flyde/resolver";
import { existsSync, writeFile, writeFileSync } from "fs";

import { OpenAIApi, Configuration } from "openai";
import { join } from "path";

const primingNotice = `You create code-based parts for Flyde, a flow-based programming tool.
This is how a part looks like:
// fileName: limit-times.flyde.ts
import { CodePart } from "@flyde/core";
export const LimitTimes: CodePart = {
  id: "Limit Times",
  description: "Item will be emitted until the limit is reached",
  inputs: {
    item: { mode: "required", description: "The item to emit" },
    times: {
      mode: "required",
      description: "The number of times to emit the item",
    },
    reset: { mode: "optional", description: "Reset the counter" },
  },
  outputs: { ok: {} },
  run: function (inputs, outputs, adv) {
    // magic here
    const { state } = adv;
    const { item, times, reset } = inputs;
    const { ok } = outputs;

    if (typeof reset !== "undefined") {
      state.set("val", 0);
      return;
    }

    let curr = state.get("val") || 0;
    curr++;
    state.set("val", curr);
    if (curr >= times) {
      adv.onError(new Error(\`Limit of \$\{times\} reached\`));
    } else {
      ok.next(item);
    }
  },
};
// end of part

you should reply only with code, no explanations
use no libraries. Assume NodeJS. Avoid hardcoded values. Prefer APIs

`;

export async function generatePartCodeFromPrompt(
  prompt: string,
  apiKey: string
) {
  const configuration = new Configuration({
    apiKey,
  });
  const openai = new OpenAIApi(configuration);
  const completion = await openai.createChatCompletion({
    model: "gpt-3.5-turbo",
    messages: [
      { role: "system", content: primingNotice },
      {
        role: "user",
        content: `Create a part that does the following: ${prompt}`,
      },
    ],
    temperature: 0.1,
    n: 1,
  });

  const code = completion.data.choices[0].message?.content;
  const fileName = code?.match(/fileName: (.*)\.flyde\.ts/)?.[1];

  console.log({ code, fileName });

  return { fileName, code };
}

export async function generateAndSavePart(
  rootDir: string,
  prompt: string,
  apiKey?: string
): Promise<ImportableSource> {
  const { fileName, code } = await generatePartCodeFromPrompt(prompt, apiKey);
  let filePath = join(rootDir, `${fileName}.flyde.ts`);
  if (existsSync(filePath)) {
    filePath = filePath.replace(/\.flyde\.ts$/, `${randomInt(9999)}.flyde.ts`);
  }

  writeFileSync(filePath, code);
  const maybePart = resolveCodePartDependencies(filePath)[0];
  if (!maybePart) {
    throw new Error("Generated part is corrupt");
  }

  const part: ImportedPart = {
    ...maybePart.part,
    source: { path: filePath, export: maybePart.exportName },
  };
  return { part, module: `./${fileName}.flyde.ts` };
}
