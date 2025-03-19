import { DevServerClient } from "@flyde/dev-server";
import { EditorPorts } from "@flyde/flow-editor";
import { useNavigate } from "react-router-dom";

export type WebPortsConfig = {
  devServerClient: DevServerClient;
  navigate: ReturnType<typeof useNavigate>;
};

export const createWebPorts = ({
  devServerClient,
  navigate,
}: WebPortsConfig): EditorPorts => {
  return {
    prompt: async ({ text, defaultValue }) => {
      return prompt(text, defaultValue);
    },
    confirm: async ({ text }) => {
      return confirm(text);
    },
    openFile: async ({ absPath }) => {
      const params = new URLSearchParams(location.search);
      params.set("fileName", absPath);
      const newUrl = decodeURIComponent(`${location.pathname}?${params}`);
      navigate(newUrl);
    },
    readFlow: async ({ absPath }) => {
      return devServerClient.readFile(absPath);
    },
    setFlow: async ({ absPath, flow }) => {
      await devServerClient.saveFile(absPath, flow);
    },
    onExternalFlowChange: () => {
      console.log("Not implemented");
      return () => {};
    },
    onRunFlow: async () => {
      alert("Not implemented");
      return {} as any;
    },
    onStopFlow: async () => {
      alert("Not implemented");
      return {} as any;
    },
    reportEvent: (name, data) => {
      console.info(`Analytics event: ${name}`, data);
    },
    generateNodeFromPrompt: async ({ prompt }) => {
      throw new Error("Not implemented");
    },
    getLibraryData: async () => {
      return devServerClient.getLibraryData();
    },
    onRequestSiblingNodes: async () => {
      return [];
    },
    onCreateCustomNode: async () => {
      throw new Error("Not implemented");
    },
    onRequestNodeSource: async () => {
      throw new Error("Not implemented");
    },
    resolveInstance: async () => {
      throw new Error("Not implemented");
    },
  };
};
