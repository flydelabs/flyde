import { noop } from "lodash";
import React, { createContext, useContext, useState } from "react";


export type PromptFunction = (text: string, defaultValue?: string) => Promise<string | undefined>;
export type PromptContextValue = {
  showPrompt: PromptFunction
};

export const PromptContext = createContext<PromptContextValue>(noop as any)

export const PromptContextProvider: React.FC<PromptContextValue> = ({ children, showPrompt }) => {

  return (
    <PromptContext.Provider value={{showPrompt}}>
      {children}
    </PromptContext.Provider>
  );
};

export const usePrompt = () => {
    return useContext(PromptContext).showPrompt;
}