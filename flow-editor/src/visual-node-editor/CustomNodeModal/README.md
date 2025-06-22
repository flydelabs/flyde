# Flyde AI Flowpilot

This module implements the AI assistant feature for the Flyde flow editor. It allows users to generate custom nodes using natural language instructions.

## API Integration

The Copilot component communicates with a backend API at `http://localhost:3035/api/custom-node-generator`. The API accepts the following parameters:

1. `prompt`: The current user input
2. `messageHistory`: An array of previous messages for context

The API returns responses in one of three formats:
1. Success: Returns generated code for a new node
2. Followup: Returns text asking for more information
3. Error: Returns error information

## Request Format

```typescript
{
  prompt: string;
  messageHistory: Array<{
    role: "assistant" | "user";
    content: string;
  }>
}
```

## How to Run the Mock Server

For development purposes, a mock server is included that simulates the backend API responses.

1. Install dependencies:
```
npm install express cors
```

2. Run the mock server:
```
node flow-editor/src/visual-node-editor/CustomNodeModal/mockServer.js
```

3. The mock server will be available at http://localhost:3035

## Testing the Integration

- When you type a prompt containing "multiply" or "code", it will return a success response with code for a multiply node
- When you type a prompt containing "error", it will return an error response
- For all other prompts, it will return a followup response asking for more information
- All requests include the full message history for context

## Integration with Real LLM Backend

In production, replace the mock server with a real LLM-backed API that follows the same response format defined in `types.ts`.

## Response Types

The API returns responses matching the following interfaces:

- `CustomCodeGenerationResultSuccess`: Contains generated code
- `CustomCodeGenerationResultFollowup`: Contains text asking for more information
- `CustomCodeGenerationResultError`: Contains error information

All responses include metadata about the LLM usage (token counts and model version). 