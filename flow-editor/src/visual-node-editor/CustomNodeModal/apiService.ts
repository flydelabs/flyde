import { CustomCodeGenerationResult } from './types';

const API_URL = 'http://localhost:3035/api/custom-node-generator';

export interface Message {
    role: "assistant" | "user";
    content: string;
}

export interface GenerateRequestPayload {
    prompt: string;
    messageHistory?: Message[];
}

export async function generateNodeCode(payload: GenerateRequestPayload): Promise<CustomCodeGenerationResult> {
    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                prompt: payload.prompt,
                messageHistory: payload.messageHistory || []
            }),
        });

        if (!response.ok) {
            throw new Error(`API request failed with status ${response.status}`);
        }

        return await response.json() as CustomCodeGenerationResult;
    } catch (error) {
        console.error('Error generating node code:', error);
        throw error;
    }
} 