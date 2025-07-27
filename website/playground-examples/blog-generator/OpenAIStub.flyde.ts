import { CodeNode } from "@flyde/core";

// Mock responses for realistic demo content
const mockBlogTitles = [
  "Why Visual Flows Are Perfect for Agentic Workflows",
  "Building AI Agents: The Visual Approach",
  "Agentic Systems Made Simple: In-Codebase Visual Flows",
  "From Code to Canvas: Visualizing Agent Logic",
  "The Future of AI Development: Visual Flow Programming"
];

const mockSummaries = {
  AI: "Explores why visual flows are the ideal solution for product teams building AI agents, covering maintainability, collaboration, and the benefits of in-codebase visual programming.",
  Technology: "Examines how visual flows address the complexity of agentic systems, enabling better collaboration between PMs, designers, and engineers while accelerating development cycles.",
  Programming: "Discusses the advantages of in-codebase visual flows that combine visual clarity with programmatic power, maintaining type safety and version control for AI systems."
};

export const OpenAIStub: CodeNode = {
  id: "OpenAIStub",
  menuDisplayName: "OpenAI (Custom Stub)",
  namespace: "ai",
  icon: `<svg fill="currentColor" width="24px" height="24px" viewBox="0 0 24 24" role="img" xmlns="http://www.w3.org/2000/svg"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"><title>OpenAI icon</title><path d="M22.2819 9.8211a5.9847 5.9847 0 0 0-.5157-4.9108 6.0462 6.0462 0 0 0-6.5098-2.9A6.0651 6.0651 0 0 0 4.9807 4.1818a5.9847 5.9847 0 0 0-3.9977 2.9 6.0462 6.0462 0 0 0 .7427 7.0966 5.98 5.98 0 0 0 .511 4.9107 6.051 6.051 0 0 0 6.5146 2.9001A5.9847 5.9847 0 0 0 13.2599 24a6.0557 6.0557 0 0 0 5.7718-4.2058 5.9894 5.9894 0 0 0 3.9977-2.9001 6.0557 6.0557 0 0 0-.7475-7.0729zm-9.022 12.6081a4.4755 4.4755 0 0 1-2.8764-1.0408l.1419-.0804 4.7783-2.7582a.7948.7948 0 0 0 .3927-.6813v-6.7369l2.02 1.1686a.071.071 0 0 1 .038.052v5.5826a4.504 4.504 0 0 1-4.4945 4.4944zm-9.6607-4.1254a4.4708 4.4708 0 0 1-.5346-3.0137l.142.0852 4.783 2.7582a.7712.7712 0 0 0 .7806 0l5.8428-3.3685v2.3324a.0804.0804 0 0 1-.0332.0615L9.74 19.9502a4.4992 4.4992 0 0 1-6.1408-1.6464zM2.3408 7.8956a4.485 4.485 0 0 1 2.3655-1.9728V11.6a.7664.7664 0 0 0 .3879.6765l5.8144 3.3543-2.0201 1.1685a.0757.0757 0 0 1-.071 0l-4.8303-2.7865A4.504 4.504 0 0 1 2.3408 7.872zm16.5963 3.8558L13.1038 8.364 15.1192 7.2a.0757.0757 0 0 1 .071 0l4.8303 2.7913a4.4944 4.4944 0 0 1-.6765 8.1042v-5.6772a.79.79 0 0 0-.407-.667zm2.0107-3.0231l-.142-.0852-4.7735-2.7818a.7759.7759 0 0 0-.7854 0L9.409 9.2297V6.8974a.0662.0662 0 0 1 .0284-.0615l4.8303-2.7866a4.4992 4.4992 0 0 1 6.6802 4.66zM8.3065 12.863l-2.02-1.1638a.0804.0804 0 0 1-.038-.0567V6.0742a4.4992 4.4992 0 0 1 7.3757-3.4537l-.142.0805L8.704 5.459a.7948.7948 0 0 0-.3927.6813zm1.0976-2.3654l2.602-1.4998 2.6069 1.4998v2.9994l-2.5974 1.4997-2.6067-1.4997Z"></path></g></svg>`,
  displayName: "OpenAI (Custom Stub)",
  description: "🎭 Custom OpenAI stub for blog generation demo - Edit this file to customize responses!",
  inputs: {
    apiKey: {
      editorType: "secret",
      editorTypeData: {
        defaultName: "OPENAI_API_KEY",
      },
      description: "🔑 OpenAI API Key (ignored in browser stub)",
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
        ],
      },
      description: "🤖 The OpenAI model to simulate",
    },
    prompt: {
      defaultValue: "Generate a summary of the following text: {{text}}",
      editorType: "longtext",
      description: "💬 Prompt for chat completion",
    },
    temperature: {
      defaultValue: 0.7,
      editorType: "number",
      description: "🌡️ Temperature for text generation (0-1)",
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
      description: "📋 Format of the response (text, JSON object, or structured JSON)",
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
      description: "🏗️ JSON schema to structure the output (only used when responseFormat is 'json_schema')",
      condition: "responseFormat === 'json_schema'"
    },
  },
  outputs: {
    completion: {
      description: "🎯 Generated completion (as string)",
    }
  },
  run: async (inputs, outputs) => {
    // 🕐 Mock delay to simulate API call - you can customize this!
    await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 1000));

    const { prompt, responseFormat } = inputs;
    
    // 🔍 Extract topic from prompt for more realistic responses
    const topicMatch = prompt.match(/topic.*?"([^"]+)"/i);
    const topic = topicMatch ? topicMatch[1] : 'AI';
    
    let mockResponse: string;
    
    // 🎲 Generate different responses based on the prompt content
    // 💡 You can edit these patterns to customize responses!
    if (prompt.includes('blog post title') || prompt.includes('captivating')) {
      // 📝 This is the title generation
      const titles = mockBlogTitles;
      const randomTitle = titles[Math.floor(Math.random() * titles.length)];
      mockResponse = randomTitle.replace('{{topic}}', topic);
    } else if (prompt.includes('summary')) {
      // 📊 This is the summary generation  
      mockResponse = mockSummaries[topic as keyof typeof mockSummaries] || mockSummaries.AI;
    } else {
      // 🔄 Default response - customize this for your needs!
      mockResponse = `This is a custom mock response about ${topic} - edit OpenAIStub.flyde.ts to customize!`;
    }

    // 📤 Handle different response formats
    if (responseFormat === "json_object" || responseFormat === "json_schema") {
      try {
        const jsonResponse = {
          summary: mockResponse,
          keyPoints: [
            `Key insight about ${topic}`,
            `Important consideration for ${topic}`, 
            `Future outlook for ${topic}`
          ]
        };
        outputs.completion.next(jsonResponse);
      } catch (e) {
        outputs.completion.next(mockResponse);
      }
    } else {
      outputs.completion.next(mockResponse);
    }
  },
};