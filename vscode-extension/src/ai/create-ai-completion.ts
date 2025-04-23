import { AiCompletionDto } from "@flyde/core";
import { OpenAI } from "openai";
import * as vscode from "vscode";



export async function createAiCompletion({
  prompt,
  jsonMode,
}: AiCompletionDto): Promise<string> {
  const config = vscode.workspace.getConfiguration("flyde");
  let openAiToken = config.get<string>("openAiToken");

  if (!openAiToken) {
    await vscode.commands.executeCommand("flyde.setOpenAiToken");
    openAiToken = config.get<string>("openAiToken");
  }

  if (!openAiToken) {
    throw new Error("OpenAI token is required");
  }

  if (prompt.trim().length === 0) {
    throw new Error("prompt is empty");
  }

  try {
    const openai = new OpenAI({
      apiKey: openAiToken,
    });

    const response = await openai.chat.completions.create({
      model: "gpt-4.1",
      // eslint-disable-next-line @typescript-eslint/naming-convention
      response_format: jsonMode ? { type: "json_object" } : undefined,
      messages: [
        {
          role: "system",
          content:
            `You are a helpful assistant helping a user fill in values for node configuration of a visual-programming platform. Reply with just the ${jsonMode ? "JSON" : "string"} value. No wrappers, no explanations, just the required value (either code or string, as requested).`,
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0,
    });

    const completion = response.choices[0]?.message?.content;

    if (!completion) {
      throw new Error("No completion received from OpenAI");
    }

    return completion;
  } catch (error) {
    if (error instanceof OpenAI.APIError) {
      throw new Error(`OpenAI API error: ${error.message}`);
    }
    throw error;
  }
}
