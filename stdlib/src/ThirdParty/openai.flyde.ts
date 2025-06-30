import axios from "axios";
import { CodeNode } from "@flyde/core";

interface OpenAIErrorResponse {
  error: {
    code: string;
    message: string;
  };
}

export const OpenAI: CodeNode = {
  id: "OpenAI",
  menuDisplayName: "OpenAI",
  namespace: "ai",
  icon: `<svg fill="currentColor" width="24px" height="24px" viewBox="0 0 24 24" role="img" xmlns="http://www.w3.org/2000/svg"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"><title>OpenAI icon</title><path d="M22.2819 9.8211a5.9847 5.9847 0 0 0-.5157-4.9108 6.0462 6.0462 0 0 0-6.5098-2.9A6.0651 6.0651 0 0 0 4.9807 4.1818a5.9847 5.9847 0 0 0-3.9977 2.9 6.0462 6.0462 0 0 0 .7427 7.0966 5.98 5.98 0 0 0 .511 4.9107 6.051 6.051 0 0 0 6.5146 2.9001A5.9847 5.9847 0 0 0 13.2599 24a6.0557 6.0557 0 0 0 5.7718-4.2058 5.9894 5.9894 0 0 0 3.9977-2.9001 6.0557 6.0557 0 0 0-.7475-7.0729zm-9.022 12.6081a4.4755 4.4755 0 0 1-2.8764-1.0408l.1419-.0804 4.7783-2.7582a.7948.7948 0 0 0 .3927-.6813v-6.7369l2.02 1.1686a.071.071 0 0 1 .038.052v5.5826a4.504 4.504 0 0 1-4.4945 4.4944zm-9.6607-4.1254a4.4708 4.4708 0 0 1-.5346-3.0137l.142.0852 4.783 2.7582a.7712.7712 0 0 0 .7806 0l5.8428-3.3685v2.3324a.0804.0804 0 0 1-.0332.0615L9.74 19.9502a4.4992 4.4992 0 0 1-6.1408-1.6464zM2.3408 7.8956a4.485 4.485 0 0 1 2.3655-1.9728V11.6a.7664.7664 0 0 0 .3879.6765l5.8144 3.3543-2.0201 1.1685a.0757.0757 0 0 1-.071 0l-4.8303-2.7865A4.504 4.504 0 0 1 2.3408 7.872zm16.5963 3.8558L13.1038 8.364 15.1192 7.2a.0757.0757 0 0 1 .071 0l4.8303 2.7913a4.4944 4.4944 0 0 1-.6765 8.1042v-5.6772a.79.79 0 0 0-.407-.667zm2.0107-3.0231l-.142-.0852-4.7735-2.7818a.7759.7759 0 0 0-.7854 0L9.409 9.2297V6.8974a.0662.0662 0 0 1 .0284-.0615l4.8303-2.7866a4.4992 4.4992 0 0 1 6.6802 4.66zM8.3065 12.863l-2.02-1.1638a.0804.0804 0 0 1-.038-.0567V6.0742a4.4992 4.4992 0 0 1 7.3757-3.4537l-.142.0805L8.704 5.459a.7948.7948 0 0 0-.3927.6813zm1.0976-2.3654l2.602-1.4998 2.6069 1.4998v2.9994l-2.5974 1.4997-2.6067-1.4997Z"></path></g></svg>`,
  displayName: "OpenAI",
  description: "Generates a chat completion using OpenAI",
  inputs: {
    apiKey: {
      editorType: "secret",
      editorTypeData: {
        defaultName: "OPENAI_API_KEY",
      },
      description: "OpenAI API Key",
    },
    model: {
      defaultValue: "gpt-4.1",
      editorType: "select",
      editorTypeData: {
        options: [
          "gpt-4.1",
          "gpt-4.1-mini",
          "gpt-4.1-nano",
          "gpt-4o",
          "chatgpt-4o-latest",
          "gpt-4o-mini",
          "o1",
          "o1-mini",
          "o3-mini",
          "o1-preview",
          "gpt-4o-realtime-preview",
          "gpt-4o-mini-realtime-preview",
          "gpt-4o-audio-preview",
        ],
      },
      description: "The model to use",
    },
    prompt: {
      defaultValue: "Generate a summary of the following text: {{text}}",
      editorType: "longtext",
      description: "Prompt for chat completion",
    },
    temperature: {
      defaultValue: 0.7,
      editorType: "number",
      description: "Temperature for text generation",
    },
    responseFormat: {
      defaultValue: "text",
      editorType: "select",
      typeConfigurable: false,
      editorTypeData: {
        options: [
          "text",
          "json_object",
          "json_schema"
        ],
      },
      label: "Response Format",
      description: "Format of the response (text, JSON object, or structured JSON according to schema)",
    },
    jsonSchema: {
      defaultValue: {
        "type": "object",
        "properties": {
          "summary": {
            "type": "string",
            "description": "A summary of the text"
          },
          "keyPoints": {
            "type": "array",
            "items": {
              "type": "string"
            },
            "description": "Key points from the text"
          }
        },
        "required": ["summary", "keyPoints"]
      },
      editorType: "json",
      label: "JSON Schema",
      description: "JSON schema to structure the output (only used when responseFormat is 'json_schema')",
      aiCompletion: {
        prompt: "Generate a JSON schema matching the following requirements: {{prompt}}. Current schema: {{value}}",
        placeholder: "Describe the structure you want for your JSON output"
      },
      condition: "responseFormat === 'json_schema'"
    },
  },
  outputs: {
    completion: {
      description: "Generated completion (as string)",
    }
  },
  run: async (inputs, outputs) => {
    const { apiKey, model, prompt, temperature, responseFormat, jsonSchema } = inputs;

    const headers = {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    };

    // Prepare request data based on the response format
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data: any = {
      model,
      messages: [{ role: "system", content: prompt }],
      temperature,
    };

    // Add response_format based on selected format
    if (responseFormat === "json_object") {
      data.response_format = { type: "json_object" };
    } else if (responseFormat === "json_schema" && jsonSchema) {
      try {
        const parsedSchema = typeof jsonSchema === 'string' ? JSON.parse(jsonSchema) : jsonSchema;

        if (!parsedSchema.additionalProperties) {
          parsedSchema.additionalProperties = false;
        }

        data.response_format = {
          type: "json_schema",
          json_schema: {
            name: 'response_format',
            schema: parsedSchema,
            strict: true
          }
        };
      } catch (e: unknown) {
        const error = e as Error;
        throw new Error(`Invalid JSON schema: ${error.message}`);
      }
    }

    try {
      const res = await axios.post(
        "https://api.openai.com/v1/chat/completions",
        data,
        { headers }
      );

      const output = res.data.choices[0].message.content;

      // Parse JSON output if using JSON response formats
      if (responseFormat === "json_object" || responseFormat === "json_schema") {
        try {
          const parsedOutput = JSON.parse(output);
          // Output the parsed JSON to both outputs
          outputs.completion.next(parsedOutput);
        } catch (e: unknown) {
          const error = e as Error;
          // If parsing fails, output the raw text
          outputs.completion.next(output);
          throw new Error(`Failed to parse JSON output: ${error.message}`);
        }
      } else {
        // For text format, output the raw text
        outputs.completion.next(output);
      }
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        const errorData = error.response.data as OpenAIErrorResponse;
        if (
          error.response.status === 400 &&
          errorData.error?.code === "context_length_exceeded"
        ) {
          throw new Error("Too many tokens for model");
        }
        throw new Error(
          `OpenAI API Error ${error.response.status}: ${errorData.error?.message || error.response.statusText
          }`
        );
      }
      throw error;
    }
  },
};
