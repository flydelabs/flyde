import { toastMsg } from "../../toaster";
import { createContext, useContext } from "react";
import { FlydeFlow, PartDefRepo, ResolvedFlydeFlowDefinition } from "@flyde/core";

export type CancelFn = () => void;

export interface EditorPorts {
    prompt: (dto: {defaultValue?: string, text?: string}) => Promise<string | null>,
    openFile: (dto: {absPath: string}) => Promise<void>,

    readFlow: (dto: {absPath: string}) => Promise<FlydeFlow>,
    saveFlow: (dto: {absPath: string, flow: FlydeFlow}) => Promise<void>,

    resolveDeps: (dto: {absPath: string}) => Promise<ResolvedFlydeFlowDefinition>,
    getImportables: (dto: {rootFolder: string, flowPath: string}) => Promise<Record<string, PartDefRepo>>

    onFlowChange: (cb: ({flow: FlydeFlow, deps: ResolvedFlydeFlowDefinition}) => void) => CancelFn;

}

const throwsNotImplemented: any = async () => { throw new Error(`Not implemented`)};

export const defaultPorts: EditorPorts = {
    prompt: async ({text, defaultValue}) => prompt(`${text}`, defaultValue),
    openFile: async (path) => {
        toastMsg(`Open ${path}`);
    },
    readFlow: throwsNotImplemented,
    saveFlow: throwsNotImplemented,
    resolveDeps: throwsNotImplemented,
    getImportables: throwsNotImplemented,
    onFlowChange: throwsNotImplemented,
}

export const PortsContext = createContext<EditorPorts>(defaultPorts);

export const usePrompt = () => {
    const dtoPrompt = useContext(PortsContext).prompt;
    return (text: string, defaultValue?: string): Promise<string | null> => dtoPrompt({text, defaultValue})
}

export type PromptFn = ReturnType<typeof usePrompt>;

export const usePorts = () => {
    return useContext(PortsContext);
}