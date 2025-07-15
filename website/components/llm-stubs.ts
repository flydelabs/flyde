import { CodeNode } from "@flyde/core";

// Mock responses for realistic demo content
const mockBlogTitles = [
  "Why Visual Flows Are Perfect for Agentic Workflows",
  "Building AI Agents: The Visual Approach",
  "Agentic Systems Made Simple: In-Codebase Visual Flows",
  "From Code to Canvas: Visualizing Agent Logic",
  "The Future of AI Development: Visual Flow Programming"
];

const mockBlogContent = {
  AI: `<h2>Visual Flows: The Perfect Match for Agentic Workflows</h2>
<p>Product teams building AI agents face a fundamental challenge: how to create complex, multi-step workflows that are both maintainable and comprehensible. Traditional code often becomes a tangled mess of function calls, making it difficult to understand the flow of data and decisions.</p>

<p>Visual flows solve this by providing a clear, intuitive representation of your agent's logic. When your AI agent needs to process user input, call external APIs, make decisions, and format responses, a visual flow shows exactly how data moves through each step. This isn't just helpful for documentation—it's essential for debugging, iteration, and collaboration.</p>

<p>The magic happens when these visual flows live directly in your codebase. Unlike external workflow tools that create silos, in-codebase visual flows integrate seamlessly with your existing TypeScript functions, maintain full type safety, and evolve alongside your application. Your team can see the big picture while still having access to the granular control that complex AI systems require.</p>`,

  Technology: `<h2>Why Product Teams Choose Visual Flows for AI Agents</h2>
<p>Building agentic systems requires coordinating multiple AI models, external services, and business logic. For product teams, this complexity quickly becomes overwhelming when expressed purely in code. Visual flows provide the clarity needed to build, maintain, and iterate on sophisticated AI workflows.</p>

<p>The key advantage lies in collaboration. When your PM can see the agent's decision tree, your designer can understand the user journey, and your engineers can debug the data flow, everyone stays aligned. Visual flows bridge the gap between technical implementation and business requirements.</p>

<p>Modern AI development demands rapid iteration. Visual flows enable teams to quickly prototype new agent behaviors, test different conversation paths, and adjust business logic without diving deep into code. This visual approach reduces the cognitive load of understanding complex systems and accelerates the development cycle.</p>`,

  Programming: `<h2>In-Codebase Visual Flows: The Best of Both Worlds</h2>
<p>The traditional choice between visual tools and code is a false dichotomy. Modern development demands both: the clarity of visual representation and the power of programmatic control. In-codebase visual flows deliver exactly this combination.</p>

<p>Unlike external workflow platforms that create integration headaches, visual flows that live in your codebase maintain full type safety, version control, and testing capabilities. Your agent's logic is both visually clear and programmatically sound. Changes to your data models automatically propagate through the visual flow, catching errors at compile time.</p>

<p>For agentic workflows specifically, this approach shines. AI agents often require complex decision trees, multi-step processing chains, and sophisticated error handling. Visual flows make these patterns immediately comprehensible while preserving the flexibility to drop down to code when needed. The result is AI systems that are both powerful and maintainable.</p>`
};

const mockSummaries = {
  AI: "Explores why visual flows are the ideal solution for product teams building AI agents, covering maintainability, collaboration, and the benefits of in-codebase visual programming.",
  Technology: "Examines how visual flows address the complexity of agentic systems, enabling better collaboration between PMs, designers, and engineers while accelerating development cycles.",
  Programming: "Discusses the advantages of in-codebase visual flows that combine visual clarity with programmatic power, maintaining type safety and version control for AI systems."
};

export const OpenAIStub: CodeNode = {
  id: "OpenAI",
  menuDisplayName: "OpenAI",
  namespace: "ai",
  icon: `<svg fill="currentColor" width="24px" height="24px" viewBox="0 0 24 24" role="img" xmlns="http://www.w3.org/2000/svg"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"><title>OpenAI icon</title><path d="M22.2819 9.8211a5.9847 5.9847 0 0 0-.5157-4.9108 6.0462 6.0462 0 0 0-6.5098-2.9A6.0651 6.0651 0 0 0 4.9807 4.1818a5.9847 5.9847 0 0 0-3.9977 2.9 6.0462 6.0462 0 0 0 .7427 7.0966 5.98 5.98 0 0 0 .511 4.9107 6.051 6.051 0 0 0 6.5146 2.9001A5.9847 5.9847 0 0 0 13.2599 24a6.0557 6.0557 0 0 0 5.7718-4.2058 5.9894 5.9894 0 0 0 3.9977-2.9001 6.0557 6.0557 0 0 0-.7475-7.0729zm-9.022 12.6081a4.4755 4.4755 0 0 1-2.8764-1.0408l.1419-.0804 4.7783-2.7582a.7948.7948 0 0 0 .3927-.6813v-6.7369l2.02 1.1686a.071.071 0 0 1 .038.052v5.5826a4.504 4.504 0 0 1-4.4945 4.4944zm-9.6607-4.1254a4.4708 4.4708 0 0 1-.5346-3.0137l.142.0852 4.783 2.7582a.7712.7712 0 0 0 .7806 0l5.8428-3.3685v2.3324a.0804.0804 0 0 1-.0332.0615L9.74 19.9502a4.4992 4.4992 0 0 1-6.1408-1.6464zM2.3408 7.8956a4.485 4.485 0 0 1 2.3655-1.9728V11.6a.7664.7664 0 0 0 .3879.6765l5.8144 3.3543-2.0201 1.1685a.0757.0757 0 0 1-.071 0l-4.8303-2.7865A4.504 4.504 0 0 1 2.3408 7.872zm16.5963 3.8558L13.1038 8.364 15.1192 7.2a.0757.0757 0 0 1 .071 0l4.8303 2.7913a4.4944 4.4944 0 0 1-.6765 8.1042v-5.6772a.79.79 0 0 0-.407-.667zm2.0107-3.0231l-.142-.0852-4.7735-2.7818a.7759.7759 0 0 0-.7854 0L9.409 9.2297V6.8974a.0662.0662 0 0 1 .0284-.0615l4.8303-2.7866a4.4992 4.4992 0 0 1 6.6802 4.66zM8.3065 12.863l-2.02-1.1638a.0804.0804 0 0 1-.038-.0567V6.0742a4.4992 4.4992 0 0 1 7.3757-3.4537l-.142.0805L8.704 5.459a.7948.7948 0 0 0-.3927.6813zm1.0976-2.3654l2.602-1.4998 2.6069 1.4998v2.9994l-2.5974 1.4997-2.6067-1.4997Z"></path></g></svg>`,
  displayName: "OpenAI",
  description: "Generates a chat completion using OpenAI (Browser Mock)",
  inputs: {
    apiKey: {
      editorType: "secret",
      editorTypeData: {
        defaultName: "OPENAI_API_KEY",
      },
      description: "OpenAI API Key (ignored in browser)",
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
      condition: "responseFormat === 'json_schema'"
    },
  },
  outputs: {
    completion: {
      description: "Generated completion (as string)",
    }
  },
  run: async (inputs, outputs) => {
    // Mock delay to simulate API call
    await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 1000));

    const { prompt, responseFormat } = inputs;
    
    // Extract topic from prompt for more realistic responses
    const topicMatch = prompt.match(/topic.*?"([^"]+)"/i);
    const topic = topicMatch ? topicMatch[1] : 'AI';
    
    let mockResponse: string;
    
    // Generate different responses based on the prompt content
    if (prompt.includes('blog post title') || prompt.includes('captivating')) {
      // This is the title generation
      const titles = mockBlogTitles;
      const randomTitle = titles[Math.floor(Math.random() * titles.length)];
      mockResponse = randomTitle.replace('{{topic}}', topic);
    } else if (prompt.includes('summary')) {
      // This is the summary generation
      mockResponse = mockSummaries[topic as keyof typeof mockSummaries] || mockSummaries.AI;
    } else {
      // Default response
      mockResponse = `This is a mock response about ${topic} generated in the browser environment.`;
    }

    // Handle different response formats
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

export const AnthropicStub: CodeNode = {
  id: "Anthropic",
  displayName: "Anthropic",
  namespace: "ai",
  menuDisplayName: "Anthropic",
  description: "Generate text using Anthropic's Claude models (Browser Mock)",
  icon: `
<svg version="1.1" id="Layer_1" xmlns:x="ns_extend;" xmlns:i="ns_ai;" xmlns:graph="ns_graphs;" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" viewBox="0 0 92.2 65" style="enable-background:new 0 0 92.2 65;" xml:space="preserve">
 <style type="text/css">
  .st0{fill: currentColor;}
 </style>
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
      description: "Anthropic API Key (ignored in browser)",
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
    // Mock delay to simulate API call
    await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 1200));

    const { prompt } = inputs;
    
    // Extract topic and subject from prompt for realistic responses
    const topicMatch = prompt.match(/topic.*?"([^"]+)"/i) || prompt.match(/{{topic}}/);
    const subjectMatch = prompt.match(/subject.*?"([^"]+)"/i) || prompt.match(/{{subject}}/);
    
    const topic = topicMatch ? (typeof topicMatch[1] === 'string' ? topicMatch[1] : 'AI') : 'AI';
    
    // Generate blog content based on topic
    let mockResponse = mockBlogContent[topic as keyof typeof mockBlogContent];
    
    if (!mockResponse) {
      mockResponse = mockBlogContent.AI;
    }
    
    // If there's a subject in the prompt, customize the response
    if (subjectMatch && typeof subjectMatch[1] === 'string') {
      const subject = subjectMatch[1];
      mockResponse = mockResponse.replace(/Artificial Intelligence|Modern Technology|Programming/g, subject);
    }
    
    outputs.response.next(mockResponse);
  },
};