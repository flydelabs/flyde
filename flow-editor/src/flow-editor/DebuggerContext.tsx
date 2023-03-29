import { PinType } from "@flyde/core";
import { HistoryPayload } from "@flyde/remote-debugger";
import { createContext, useContext } from "react";


export interface DebuggerContextData {
    onRequestHistory: (
        insId: string,
        pinId: string,
        type: PinType
      ) => Promise<HistoryPayload>;
}


const DebuggerContext = createContext<DebuggerContextData>({
    onRequestHistory: () => Promise.reject(new Error("Not implemented")),
});

export const DebuggerContextProvider = DebuggerContext.Provider;

export const useDebuggerContext = () => {
    return useContext(DebuggerContext);
}