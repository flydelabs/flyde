export enum ModelType {
    CLAUDE_3_5_HAIKU = 'claude-3-5-haiku-latest',
    CLAUDE_3_5_SONNET = 'claude-3-5-sonnet-latest',
    CLAUDE_3_7_SONNET = 'claude-3-7-sonnet-latest',
}

export interface LLMMetadata {
    inputTokens: number;
    outputTokens: number;
    model: ModelType;
}

export interface CustomCodeGenerationResultSuccess {
    type: 'success';
    rawCodeNode: string;
    metadata: LLMMetadata;
}

export interface CustomCodeGenerationResultError {
    type: 'error';
    error: string;
    metadata: LLMMetadata;
}

export interface CustomCodeGenerationResultFollowup {
    type: 'followup';
    text: string;
    metadata: LLMMetadata;
}

export type CustomCodeGenerationResult = CustomCodeGenerationResultSuccess | CustomCodeGenerationResultError | CustomCodeGenerationResultFollowup; 