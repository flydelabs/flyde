import { createContext, useContext } from "react";

const DarkModeContext = createContext<boolean>(true);

export const DarkModeProvider = DarkModeContext.Provider;

export const useDarkMode = () => {
  return useContext(DarkModeContext);
};
