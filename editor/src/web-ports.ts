import { DevServerClient } from "@flyde/dev-server";
import { EditorPorts, toastMsg } from "@flyde/flow-editor";
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
      toastMsg(newUrl);
      navigate(newUrl);
    },
    readFlow: async ({ absPath }) => {
      return devServerClient.readFile(absPath);
    },
    setFlow: async ({ absPath, flow }) => {
      await devServerClient.saveFile(absPath, flow);
    },
    resolveDeps: async ({ relativePath }) => {
      return devServerClient
        .resolveDefinitions(relativePath)
        .then((f) => f.dependencies);
    },
    getImportables: async ({ rootFolder }) => {
      return devServerClient.getImportables(rootFolder);
    },
    onExternalFlowChange: () => {
      console.log("Not implemented");
      return () => {};
    },
    onInstallRuntimeRequest: async () => {
      alert("Not implemented");
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
      return devServerClient.generateNodeFromPrompt(prompt);
    },
    hasOpenAiToken: async () => {
      return true;
    },
    getLibraryData: async () => {
      return devServerClient.getLibraryData();
    },
  };
};
