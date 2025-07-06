import { CodeNode } from "@flyde/core";
import axios from "axios";

interface AnthropicErrorResponse {
  error?: {
    message: string;
    type?: string;
  };
}

export const Anthropic: CodeNode = {
  id: "Anthropic",
  displayName: "Anthropic",
  namespace: "ai",
  menuDisplayName: "Anthropic",
  description: "Generate text using Anthropic's Claude models",
  icon: `
<svg version="1.1" id="Layer_1" xmlns:x="ns_extend;" xmlns:i="ns_ai;" xmlns:graph="ns_graphs;" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" viewBox="0 0 92.2 65" style="enable-background:new 0 0 92.2 65;" xml:space="preserve">
 <style type="text/css">
  .st0{fill: currentColor;}
 </style>
 <metadata>
  <sfw xmlns="ns_sfw;">
   <slices>
   </slices>
   <sliceSourceBounds bottomLeftOrigin="true" height="65" width="92.2" x="-43.7" y="-98">
   </sliceSourceBounds>
  </sfw>
 </metadata>
 <path class="st0" d="M66.5,0H52.4l25.7,65h14.1L66.5,0z M25.7,0L0,65h14.4l5.3-13.6h26.9L51.8,65h14.4L40.5,0C40.5,0,25.7,0,25.7,0z
	 M24.3,39.3l8.8-22.8l8.8,22.8H24.3z">
 </path>
</svg>`,
  inputs: {
    apiKey: {
      editorType: "secret",
      editorTypeData: {
        defaultName: "ANTHROPIC_API_KEY",
      },
      description: "Anthropic API Key",
    },
    model: {
      defaultValue: "claude-3-7-sonnet-latest",
      editorType: "select",
      editorTypeData: {
        options: [
          "claude-opus-4-20250514",
          "claude-sonnet-4-20250514",
          "claude-3-7-sonnet-20250219",
          "claude-3-7-sonnet-latest",
          "claude-3-5-sonnet-20241022",
          "claude-3-5-sonnet-latest",
          "claude-3-5-sonnet-20240620",
          "claude-3-5-haiku-20241022",
          "claude-3-5-haiku-latest",
          "claude-3-opus-20240229",
          "claude-3-opus-latest",
          "claude-3-sonnet-20240229",
          "claude-3-haiku-20240307",
        ],
      },
      description: "Anthropic model to use",
    },
    prompt: {
      defaultValue: "Generate a response to the following: {{text}}",
      editorType: "longtext",
      description: "Prompt for text generation",
    },
    temperature: {
      defaultValue: 0.7,
      editorType: "number",
      description: "Temperature for response generation (0-1)",
    },
    maxTokens: {
      defaultValue: 1000,
      editorType: "number",
      description: "Maximum number of tokens to generate",
    },
  },
  outputs: {
    response: {
      description: "Generated text response",
    },
  },
  run: async (inputs, outputs) => {
    const { apiKey, model, prompt, temperature, maxTokens } = inputs;

    const headers = {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "Content-Type": "application/json",
    };

    const data = {
      model,
      messages: [
        { role: "user", content: prompt }
      ],
      temperature: parseFloat(temperature),
      max_tokens: maxTokens,
    };

    try {
      const res = await axios.post(
        "https://api.anthropic.com/v1/messages",
        data,
        { headers }
      );
      outputs.response.next(res.data?.content[0]?.text);
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        const errorData = error.response.data as AnthropicErrorResponse;
        throw new Error(
          `Anthropic API Error ${error.response.status}: ${errorData.error?.message || error.response.statusText
          }`
        );
      }
      throw error;
    }
  },
};
