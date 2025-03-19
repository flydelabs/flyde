import { createContext, useContext } from "react";
import {
  FlydeFlow,
  NodeLibraryData,
  noop,
  FlowJob,
  MacroNodeDefinition,
  NodeOrMacroDefinition,
  NodeInstance,
  EditorNodeInstance,
  ImportableEditorNode,
} from "@flyde/core";
import { ReportEvent } from "./analytics";

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

  onExternalFlowChange: (cb: (data: { flow: FlydeFlow }) => void) => CancelFn;

  onRunFlow: (
    inputs: Record<string, any>,
    executionDelay?: number
  ) => Promise<FlowJob>;
  onStopFlow: () => Promise<void>;

  reportEvent: ReportEvent;

  generateNodeFromPrompt: (dto: {
    prompt: string;
  }) => Promise<{ importableNode: EditorNodeInstance }>;
  getLibraryData: () => Promise<NodeLibraryData>;

  onRequestSiblingNodes: (dto: {
    macro: MacroNodeDefinition<any>;
  }) => Promise<MacroNodeDefinition<any>[]>;

  onRequestNodeSource: (dto: {
    node: NodeOrMacroDefinition;
  }) => Promise<string>;
  onCreateCustomNode: (dto: { code: string }) => Promise<ImportableEditorNode>;
  createAiCompletion?: (dto: { prompt: string }) => Promise<string>;

  resolveInstance: (dto: {
    flow: FlydeFlow;
    instance: NodeInstance;
  }) => Promise<EditorNodeInstance>;
}

const toastNotImplemented: any = (method: string) => async () => {
  console.warn(`${method} Not implemented`);
  alert(`${method} Not implemented`);
};

export const defaultPorts: EditorPorts = {
  prompt: async ({ text, defaultValue }) => prompt(`${text}`, defaultValue),
  openFile: async (path) => {
    // toastMsg(`Open ${path}`);
  },
  confirm: async ({ text }) => confirm(text),
  readFlow: toastNotImplemented("readFlow"),
  setFlow: toastNotImplemented("setFlow"),

  onExternalFlowChange: toastNotImplemented("onExternalFlowChange"),
  onRunFlow: toastNotImplemented("onRunFlow"),
  onStopFlow: toastNotImplemented("onStopFlow"),
  reportEvent: noop,
  generateNodeFromPrompt: toastNotImplemented("generateNodeFromPrompt"),
  getLibraryData: () => Promise.resolve({ groups: [] }),
  onRequestSiblingNodes: () => Promise.resolve([]),
  onCreateCustomNode: toastNotImplemented("onCreateCustomNode"),
  onRequestNodeSource: () => {
    throw new Error("Not implemented");
  },
  resolveInstance: () => {
    throw new Error("Not implemented");
  },
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
