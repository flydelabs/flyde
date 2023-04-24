import "dotenv/config";

import { OpenAIApi, Configuration } from "openai";
const configuration = new Configuration({
  apiKey: process.env.OPEN_AI_API_KEY,
});
const openai = new OpenAIApi(configuration);

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

`;

export async function generatePartCodeFromPrompt(prompt: string) {
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
  });

  const code = completion.data.choices[0].message?.content;
  const fileName = code?.match(/fileName: (.*)\.flyde\.ts/)?.[1];

  console.log({ code, fileName });

  return { fileName, code };
}
