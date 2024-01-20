import { createContext, useContext } from "react";
import {
  FlydeFlow,
  ImportableSource,
  NodeLibraryData,
  NodeLibraryGroup,
  ResolvedDependenciesDefinitions,
  noop,
} from "@flyde/core";
import { FlowJob, ImportablesResult } from "@flyde/dev-server";
import { ReportEvent } from "./analytics";
import { toastMsg } from "../../toaster";

export * from "./analytics";

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
    relativePath: string;
    flow?: FlydeFlow;
  }) => Promise<ResolvedDependenciesDefinitions>;

  getImportables: (dto: {
    rootFolder: string;
    flowPath: string;
  }) => Promise<ImportablesResult>;

  onExternalFlowChange: (
    cb: (data: {
      flow: FlydeFlow;
      deps: ResolvedDependenciesDefinitions;
    }) => void
  ) => CancelFn;

  onInstallRuntimeRequest: () => Promise<void>;

  onRunFlow: (
    inputs: Record<string, any>,
    executionDelay?: number
  ) => Promise<FlowJob>;
  onStopFlow: () => Promise<void>;

  reportEvent: ReportEvent;

  generateNodeFromPrompt: (dto: {
    prompt: string;
  }) => Promise<{ importableNode: ImportableSource }>;

  hasOpenAiToken: () => Promise<boolean>;
  getLibraryData: () => Promise<NodeLibraryData>;
}

const toastNotImplemented: any = (method: string) => async () => {
  console.warn(`${method} Not implemented`);
  toastMsg(`Feature not implemented in this context yet`, "warning");
};

export const defaultPorts: EditorPorts = {
  prompt: async ({ text, defaultValue }) => prompt(`${text}`, defaultValue),
  openFile: async (path) => {
    // toastMsg(`Open ${path}`);
  },
  confirm: async ({ text }) => confirm(text),
  readFlow: toastNotImplemented("readFlow"),
  setFlow: toastNotImplemented("setFlow"),
  resolveDeps: toastNotImplemented("resolveDeps"),

  getImportables: toastNotImplemented("getImportables"),
  onExternalFlowChange: toastNotImplemented("onExternalFlowChange"),
  onInstallRuntimeRequest: toastNotImplemented("onInstallRuntimeRequest"),
  onRunFlow: toastNotImplemented("onRunFlow"),
  onStopFlow: toastNotImplemented("onStopFlow"),
  reportEvent: noop,
  generateNodeFromPrompt: toastNotImplemented("generateNodeFromPrompt"),
  hasOpenAiToken: () => Promise.resolve(false),
  getLibraryData: () => Promise.resolve({ groups: [] }),
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
