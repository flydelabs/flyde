import { createContext, useContext } from "react";
import { AiCompletionDto } from "../../flow-editor/ports";

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
