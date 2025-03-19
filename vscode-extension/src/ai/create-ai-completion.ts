import { OpenAI } from "openai";
import * as vscode from "vscode";

export interface CreateAiCompletionParams {
  prompt: string;
  jsonMode?: boolean;
}

export async function createAiCompletion({
  prompt,
  jsonMode,
}: CreateAiCompletionParams): Promise<string> {
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
      model: "gpt-4o",
      // eslint-disable-next-line @typescript-eslint/naming-convention
      response_format: jsonMode ? { type: "json_object" } : undefined,
      messages: [
        {
          role: "system",
          content:
            "You are a helpful coding assistant. Provide direct code responses without explanations.",
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
