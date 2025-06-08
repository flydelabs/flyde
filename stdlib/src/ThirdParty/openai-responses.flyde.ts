import axios from "axios";
import { CodeNode, createInputGroup } from "@flyde/core";

interface OpenAIErrorResponse {
  error: {
    code: string;
    message: string;
  };
}

export const OpenAIResponsesAPI: CodeNode = {
  id: "OpenAIResponsesAPI",
  menuDisplayName: "OpenAI Responses API",
  namespace: "ai",
  icon: `<svg fill="currentColor" width="24px" height="24px" viewBox="0 0 24 24" role="img" xmlns="http://www.w3.org/2000/svg"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"><title>OpenAI icon</title><path d="M22.2819 9.8211a5.9847 5.9847 0 0 0-.5157-4.9108 6.0462 6.0462 0 0 0-6.5098-2.9A6.0651 6.0651 0 0 0 4.9807 4.1818a5.9847 5.9847 0 0 0-3.9977 2.9 6.0462 6.0462 0 0 0 .7427 7.0966 5.98 5.98 0 0 0 .511 4.9107 6.051 6.051 0 0 0 6.5146 2.9001A5.9847 5.9847 0 0 0 13.2599 24a6.0557 6.0557 0 0 0 5.7718-4.2058 5.9894 5.9894 0 0 0 3.9977-2.9001 6.0557 6.0557 0 0 0-.7475-7.0729zm-9.022 12.6081a4.4755 4.4755 0 0 1-2.8764-1.0408l.1419-.0804 4.7783-2.7582a.7948.7948 0 0 0 .3927-.6813v-6.7369l2.02 1.1686a.071.071 0 0 1 .038.052v5.5826a4.504 4.504 0 0 1-4.4945 4.4944zm-9.6607-4.1254a4.4708 4.4708 0 0 1-.5346-3.0137l.142.0852 4.783 2.7582a.7712.7712 0 0 0 .7806 0l5.8428-3.3685v2.3324a.0804.0804 0 0 1-.0332.0615L9.74 19.9502a4.4992 4.4992 0 0 1-6.1408-1.6464zM2.3408 7.8956a4.485 4.485 0 0 1 2.3655-1.9728V11.6a.7664.7664 0 0 0 .3879.6765l5.8144 3.3543-2.0201 1.1685a.0757.0757 0 0 1-.071 0l-4.8303-2.7865A4.504 4.504 0 0 1 2.3408 7.872zm16.5963 3.8558L13.1038 8.364 15.1192 7.2a.0757.0757 0 0 1 .071 0l4.8303 2.7913a4.4944 4.4944 0 0 1-.6765 8.1042v-5.6772a.79.79 0 0 0-.407-.667zm2.0107-3.0231l-.142-.0852-4.7735-2.7818a.7759.7759 0 0 0-.7854 0L9.409 9.2297V6.8974a.0662.0662 0 0 1 .0284-.0615l4.8303-2.7866a4.4992 4.4992 0 0 1 6.6802 4.66zM8.3065 12.863l-2.02-1.1638a.0804.0804 0 0 1-.038-.0567V6.0742a4.4992 4.4992 0 0 1 7.3757-3.4537l-.142.0805L8.704 5.459a.7948.7948 0 0 0-.3927.6813zm1.0976-2.3654l2.602-1.4998 2.6069 1.4998v2.9994l-2.5974 1.4997-2.6067-1.4997Z"></path></g></svg>`,
  displayName: "OpenAI Responses",
  description: "Interact with OpenAI's new Responses API for stateful, multimodal, and tool-augmented conversations.",
  inputs: {
    authentication: {
      group: createInputGroup("Authentication", ["apiKey"], {
        collapsible: true,
        defaultCollapsed: true,
      }),
    },
    apiKey: {
      editorType: "secret",
      editorTypeData: {
        defaultName: "OPENAI_API_KEY",
      },
      description: "OpenAI API Key",
    },
    stateMode: {
      defaultValue: "managed",
      label: "State Management",
      description: "How to handle conversation state",
      editorType: "select",
      typeConfigurable: false,
      editorTypeData: {
        options: [
          { label: "Managed (OpenAI handles state)", value: "managed" },
          { label: "Controlled (Manual history)", value: "controlled" },
        ],
      },
    },
    model: {
      defaultValue: "gpt-4o-mini",
      editorType: "select",
      editorTypeData: {
        options: [
          // Latest models first
          "gpt-4.1",
          "gpt-4.1-mini",
          "gpt-4.1-nano",
          "o4-mini",
          "o3",
          "o3-mini",
          "gpt-4.5-preview",
          "gpt-4o",
          "gpt-4o-mini",
          "o1",
          "o1-mini",
          "o1-preview",
          "gpt-4-turbo",
          "gpt-4",
          "gpt-3.5-turbo",
          // Audio models
          "gpt-4o-audio-preview",
          "gpt-4o-mini-audio-preview",
          "gpt-4o-realtime-preview",
          "gpt-4o-mini-realtime-preview",
        ],
      },
      description: "The model to use",
    },
    input: {
      defaultValue: "Hello!",
      editorType: "longtext",
      description: "Input prompt or array for multimodal (text, image, audio)",
    },
    previousResponseId: {
      defaultValue: "",
      editorType: "string",
      description: "ID of previous response to continue/fork conversation",
      condition: "stateMode === 'managed'",
    },
    conversationHistory: {
      defaultValue: [],
      editorType: "json",
      description: "Array of conversation messages for controlled state",
      condition: "stateMode === 'controlled'",
    },
    modelOptions: {
      group: createInputGroup("Model Options", ["temperature", "maxOutputTokens", "topP"], {
        collapsible: true,
        defaultCollapsed: true,
      }),
    },
    temperature: {
      defaultValue: 1.0,
      editorType: "number",
      description: "Sampling temperature (0-2)",
    },
    maxOutputTokens: {
      defaultValue: 1000,
      editorType: "number",
      description: "Maximum tokens to generate (optional)",
    },
    topP: {
      defaultValue: 1.0,
      editorType: "number",
      description: "Nucleus sampling parameter (0-1)",
    },
    toolsAndAdvanced: {
      group: createInputGroup("Tools & Advanced", ["tools", "toolChoice", "reasoningEffort"], {
        collapsible: true,
        defaultCollapsed: true,
      }),
    },
    tools: {
      defaultValue: [],
      editorType: "json",
      description: "Array of hosted tools to enable (e.g., [{ type: 'web_search' }])",
    },
    toolChoice: {
      defaultValue: "auto",
      editorType: "select",
      editorTypeData: {
        options: ["auto", "none", "required"],
      },
      description: "How the model should use tools",
    },
    reasoningEffort: {
      defaultValue: null,
      editorType: "select",
      editorTypeData: {
        options: [
          { label: "Default", value: null },
          { label: "Low", value: "low" },
          { label: "Medium", value: "medium" },
          { label: "High", value: "high" },
        ],
      },
      description: "Reasoning effort for o-series models (optional)",
      condition: "model.startsWith('o')",
    },
  },
  outputs: {
    response: {
      description: "The full response object from the API",
    },
    responseId: {
      description: "The response ID for continuing conversations",
    },
    content: {
      description: "Extracted content from the response",
    },
  },
  run: async (inputs, outputs, adv) => {
    const {
      apiKey,
      stateMode,
      model,
      input,
      previousResponseId,
      conversationHistory,
      temperature,
      maxOutputTokens,
      topP,
      tools,
      toolChoice,
      reasoningEffort
    } = inputs;

    if (!apiKey) {
      adv.onError("OpenAI API key is required");
      return;
    }

    const headers = {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    };

    // Build request data based on state mode
    const data: Record<string, unknown> = {
      model,
      temperature,
      top_p: topP,
    };

    // Add optional parameters
    if (maxOutputTokens) {
      data.max_output_tokens = maxOutputTokens;
    }

    if (tools && Array.isArray(tools) && tools.length > 0) {
      data.tools = tools;
      data.tool_choice = toolChoice;
    }

    if (reasoningEffort && model.startsWith('o')) {
      data.reasoning_effort = reasoningEffort;
    }

    // Handle state management
    if (stateMode === "managed") {
      // Managed state: OpenAI handles conversation history
      data.input = input;
      if (previousResponseId) {
        data["previous_response_id"] = previousResponseId;
      }
    } else {
      // Controlled state: Manual conversation history
      if (conversationHistory && Array.isArray(conversationHistory)) {
        data.input = [...conversationHistory, { role: "user", content: input }];
      } else {
        data.input = input;
      }
    }

    try {
      const res = await axios.post(
        "https://api.openai.com/v1/responses",
        data,
        { headers }
      );

      const responseData = res.data;

      // Output the full response
      outputs.response.next(responseData);

      // Output the response ID for continuation
      if (responseData.id) {
        outputs.responseId.next(responseData.id);
      }

      // Extract and output content
      if (responseData.output && Array.isArray(responseData.output)) {
        const content = responseData.output
          .filter(item => item.type === "message" && item.content)
          .map(item => item.content)
          .flat()
          .filter(content => content.type === "output_text")
          .map(content => content.text)
          .join("\n");

        if (content) {
          outputs.content.next(content);
        }
      }
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        const errorData = error.response.data as OpenAIErrorResponse;
        adv.onError(
          `OpenAI Responses API Error ${error.response.status}: ${errorData.error?.message || error.response.statusText}`
        );
        return;
      }
      adv.onError(`Error: ${(error as Error).message}`);
    }
  },
};
