import { CodeNode } from "@flyde/core";

// 📚 Mock blog content templates - customize these for your use case!
const mockBlogContent = {
  AI: `<h2>🧠 Visual Flows: The Perfect Match for Agentic Workflows</h2>
<p>Product teams building AI agents face a fundamental challenge: how to create complex, multi-step workflows that are both maintainable and comprehensible. Traditional code often becomes a tangled mess of function calls, making it difficult to understand the flow of data and decisions.</p>

<p>Visual flows solve this by providing a clear, intuitive representation of your agent's logic. When your AI agent needs to process user input, call external APIs, make decisions, and format responses, a visual flow shows exactly how data moves through each step. This isn't just helpful for documentation—it's essential for debugging, iteration, and collaboration.</p>

<p>The magic happens when these visual flows live directly in your codebase. Unlike external workflow tools that create silos, in-codebase visual flows integrate seamlessly with your existing TypeScript functions, maintain full type safety, and evolve alongside your application. Your team can see the big picture while still having access to the granular control that complex AI systems require.</p>`,

  Technology: `<h2>🚀 Why Product Teams Choose Visual Flows for AI Agents</h2>
<p>Building agentic systems requires coordinating multiple AI models, external services, and business logic. For product teams, this complexity quickly becomes overwhelming when expressed purely in code. Visual flows provide the clarity needed to build, maintain, and iterate on sophisticated AI workflows.</p>

<p>The key advantage lies in collaboration. When your PM can see the agent's decision tree, your designer can understand the user journey, and your engineers can debug the data flow, everyone stays aligned. Visual flows bridge the gap between technical implementation and business requirements.</p>

<p>Modern AI development demands rapid iteration. Visual flows enable teams to quickly prototype new agent behaviors, test different conversation paths, and adjust business logic without diving deep into code. This visual approach reduces the cognitive load of understanding complex systems and accelerates the development cycle.</p>`,

  Programming: `<h2>⚡ In-Codebase Visual Flows: The Best of Both Worlds</h2>
<p>The traditional choice between visual tools and code is a false dichotomy. Modern development demands both: the clarity of visual representation and the power of programmatic control. In-codebase visual flows deliver exactly this combination.</p>

<p>Unlike external workflow platforms that create integration headaches, visual flows that live in your codebase maintain full type safety, version control, and testing capabilities. Your agent's logic is both visually clear and programmatically sound. Changes to your data models automatically propagate through the visual flow, catching errors at compile time.</p>

<p>For agentic workflows specifically, this approach shines. AI agents often require complex decision trees, multi-step processing chains, and sophisticated error handling. Visual flows make these patterns immediately comprehensible while preserving the flexibility to drop down to code when needed. The result is AI systems that are both powerful and maintainable.</p>`
};

export const AnthropicStub: CodeNode = {
  id: "AnthropicStub",
  displayName: "Anthropic (Custom Stub)",
  namespace: "ai",
  menuDisplayName: "Anthropic (Custom Stub)",
  description: "🎭 Custom Anthropic stub for blog generation demo - Edit this file to customize responses!",
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
      description: "🔑 Anthropic API Key (ignored in browser stub)",
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
      description: "🤖 Anthropic Claude model to simulate",
    },
    prompt: {
      defaultValue: "Generate a response to the following: {{text}}",
      editorType: "longtext",
      description: "💬 Prompt for text generation",
    },
    temperature: {
      defaultValue: 0.7,
      editorType: "number",
      description: "🌡️ Temperature for response generation (0-1)",
    },
    maxTokens: {
      defaultValue: 1000,
      editorType: "number",
      description: "📏 Maximum number of tokens to generate",
    },
  },
  outputs: {
    response: {
      description: "🎯 Generated text response",
    },
  },
  run: async (inputs, outputs) => {
    // 🕐 Mock delay to simulate API call - you can customize this timing!
    await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 1200));

    const { prompt } = inputs;
    
    // 🔍 Extract topic and subject from prompt for realistic responses
    const topicMatch = prompt.match(/topic.*?"([^"]+)"/i) || prompt.match(/{{topic}}/);
    const subjectMatch = prompt.match(/subject.*?"([^"]+)"/i) || prompt.match(/{{subject}}/);
    
    const topic = topicMatch ? (typeof topicMatch[1] === 'string' ? topicMatch[1] : 'AI') : 'AI';
    
    // 🎨 Generate blog content based on topic - edit these templates!
    let mockResponse = mockBlogContent[topic as keyof typeof mockBlogContent];
    
    if (!mockResponse) {
      // 🔄 Fallback to AI content if topic not found
      mockResponse = mockBlogContent.AI;
    }
    
    // 🎯 If there's a subject in the prompt, customize the response
    if (subjectMatch && typeof subjectMatch[1] === 'string') {
      const subject = subjectMatch[1];
      // 📝 Replace generic terms with the specific subject
      mockResponse = mockResponse.replace(/Artificial Intelligence|Modern Technology|Programming/g, subject);
    }
    
    // 🎁 Add a custom signature to show this is from the editable stub
    mockResponse += `\n\n<p><em>✨ Generated by your custom AnthropicStub - edit AnthropicStub.flyde.ts to customize responses!</em></p>`;
    
    outputs.response.next(mockResponse);
  },
};