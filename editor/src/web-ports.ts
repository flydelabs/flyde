import { DevServerClient } from "@flyde/dev-server";
import { EditorPorts, toastMsg } from "@flyde/flow-editor";
import { useHistory } from "react-router";

export type WebPortsConfig = {
  devServerClient: DevServerClient;
  history: ReturnType<typeof useHistory>;
};

export const createWebPorts = ({
  devServerClient,
  history,
}: WebPortsConfig): EditorPorts => {
  return {
    prompt: async ({ text, defaultValue }) => {
      return prompt(text, defaultValue);
    },
    confirm: async ({ text }) => {
      return confirm(text);
    },
    openFile: async ({ absPath }) => {
      const params = new URLSearchParams(history.location.search);
      params.set("fileName", absPath);
      const newUrl = decodeURIComponent(`${location.pathname}?${params}`);
      toastMsg(newUrl);
      history.push(newUrl);
    },
    readFlow: async ({ absPath }) => {
      return devServerClient.readFile(absPath);
    },
    setFlow: async ({ absPath, flow }) => {
      await devServerClient.saveFile(absPath, flow);
    },
    resolveDeps: async ({ absPath }) => {
      return devServerClient.resolveDefinitions(absPath);
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
  };
};
