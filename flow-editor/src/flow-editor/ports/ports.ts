import { createContext, useContext } from "react";
import {
  FlydeFlow,
  ResolvedDependenciesDefinitions,
} from "@flyde/core";
import { Importables, FlowJob } from "@flyde/dev-server";

export type CancelFn = () => void;

export interface EditorPorts {
  prompt: (dto: {
    defaultValue?: string;
    text?: string;
  }) => Promise<string | null>;
  confirm: (dto: { text: string }) => Promise<boolean>;

  openFile: (dto: { absPath: string }) => Promise<void>;

  readFlow: (dto: { absPath: string }) => Promise<FlydeFlow>;
  setFlow: (dto: { absPath: string; flow: FlydeFlow }) => Promise<void>;

  resolveDeps: (dto: {
    absPath: string;
  }) => Promise<ResolvedDependenciesDefinitions>;
  getImportables: (dto: {
    rootFolder: string;
    flowPath: string;
  }) => Promise<Importables>;

  onExternalFlowChange: (
    cb: (data: { flow: FlydeFlow; deps: ResolvedDependenciesDefinitions }) => void
  ) => CancelFn;

  onInstallRuntimeRequest: () => Promise<void>;

  onRunFlow: (inputs: Record<string, any>) => Promise<FlowJob>;
  onStopFlow: () => Promise<void>;
}

const throwsNotImplemented: any = async () => {
  throw new Error(`Not implemented`);
};

export const defaultPorts: EditorPorts = {
  prompt: async ({ text, defaultValue }) => prompt(`${text}`, defaultValue),
  openFile: async (path) => {
    // toastMsg(`Open ${path}`);
  },
  confirm: async ({ text }) => confirm(text),
  readFlow: throwsNotImplemented,
  setFlow: throwsNotImplemented,
  resolveDeps: throwsNotImplemented,
  getImportables: throwsNotImplemented,
  onExternalFlowChange: throwsNotImplemented,
  onInstallRuntimeRequest: throwsNotImplemented,
  onRunFlow: throwsNotImplemented,
  onStopFlow: throwsNotImplemented,
};

export const PortsContext = createContext<EditorPorts>(defaultPorts);

export const usePrompt = () => {
  const dtoPrompt = useContext(PortsContext).prompt;
  return (text: string, defaultValue?: string): Promise<string | null> =>
    dtoPrompt({ text, defaultValue });
};

export const useConfirm = () => {
  const dtoPrompt = useContext(PortsContext).confirm;
  return (text: string): Promise<boolean> => dtoPrompt({ text });
};

export type PromptFn = ReturnType<typeof usePrompt>;

export const usePorts = () => {
  return useContext(PortsContext);
};
