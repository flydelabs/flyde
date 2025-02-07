import { createContext, useContext } from "react";

export interface AiPromptRequest {
  prompt: string;
  jsonMode?: boolean;
}

export interface AiCompletionContext {
  createCompletion: (data: AiPromptRequest) => Promise<string>;
  enabled: boolean;
}

// eslint-disable-next-line @typescript-eslint/no-redeclare
const AiCompletionContext = createContext<AiCompletionContext | null>(null);

export const useAiCompletion = () => {
  const context = useContext(AiCompletionContext);
  if (!context) {
    return {
      createCompletion: () => Promise.resolve(""),
      enabled: false,
    };
  }
  return context;
};

export const AiCompletionProvider = AiCompletionContext.Provider;
