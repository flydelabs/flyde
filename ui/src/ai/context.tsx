import { createContext, useContext } from "react";

// copied from ports, TODO - merge somehow using a lower-level pkg
export interface AiCompletionDto {
  prompt: string;
  nodeId: string;
  insId: string;
  jsonMode?: boolean;
};

export interface AiCompletionContext {
  createCompletion: (dto: AiCompletionDto) => Promise<string>;
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
