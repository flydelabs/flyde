// This file is for demonstration purposes only
// It simulates the API server for local development

const express = require('express');
const cors = require('cors');
const app = express();
const PORT = 3035;

// Enable CORS for all routes
app.use(cors());
app.use(express.json());

// Mock responses
const successResponse = {
    type: 'success',
    rawCodeNode: `
import type { CodeNode } from "@flyde/core";

const node: CodeNode = {
  id: "Multiply",
  displayName: "Multiply",
  icon: "fa-times",
  description: "Multiplies two numbers together",
  inputs: {
    a: { description: "First number" },
    b: { description: "Second number" },
  },
  outputs: { result: { description: "The product of a and b" } },
  run: ({ a, b }, { result }) => result.next(a * b),
};

export default node;
  `,
    metadata: {
        inputTokens: 150,
        outputTokens: 300,
        model: 'claude-3-5-sonnet-latest'
    }
};

const followupResponse = {
    type: 'followup',
    text: "I can help you create that node. What operation would you like it to perform?",
    metadata: {
        inputTokens: 20,
        outputTokens: 15,
        model: 'claude-3-5-sonnet-latest'
    }
};

const errorResponse = {
    type: 'error',
    error: "Unable to generate code due to an internal error",
    metadata: {
        inputTokens: 50,
        outputTokens: 10,
        model: 'claude-3-5-sonnet-latest'
    }
};

// Define API endpoint
app.post('/api/custom-node-generator', (req, res) => {
    const { prompt, messageHistory } = req.body;

    console.log('Received prompt:', prompt);
    console.log('Message history:', JSON.stringify(messageHistory, null, 2));

    // Simple logic to determine which response to send
    if (prompt.toLowerCase().includes('error')) {
        return res.json(errorResponse);
    } else if (prompt.toLowerCase().includes('multiply') || prompt.toLowerCase().includes('code')) {
        return res.json(successResponse);
    } else {
        return res.json(followupResponse);
    }
});

// Start the server
app.listen(PORT, () => {
    console.log(`Mock server running at http://localhost:${PORT}`);
});

// To run this mock server:
// 1. npm install express cors
// 2. node mockServer.js 