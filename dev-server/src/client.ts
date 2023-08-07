import axios from "axios";
import {
  FlydeFlow,
  ImportableSource,
  ResolvedDependenciesDefinitions,
} from "@flyde/core";
import { FolderStructure } from "./fs-helper/shared";
import type { ImportablesResult } from "./service/scan-importable-parts";
export type { ImportablesResult } from "./service/scan-importable-parts";

export * from "./runner/shared";

export const createDevServerClient = (baseUrl: string) => {
  return {
    readFile: (filename: string): Promise<FlydeFlow> => {
      return axios
        .get(`${baseUrl}/file?name=${filename}`)
        .then((res) => res.data);
    },
    saveFile: async (filename: string, data: FlydeFlow) => {
      return axios.put(`${baseUrl}/file?name=${filename}`, data);
    },
    fileStructure: async (): Promise<FolderStructure> => {
      return axios.get(`${baseUrl}/structure`).then((res) => res.data);
    },
    resolveDefinitions: (
      filename: string
    ): Promise<ResolvedDependenciesDefinitions> => {
      return axios
        .get(`${baseUrl}/resolveDefinitions?filename=${filename}`)
        .then((res) => res.data);
    },
    getImportables: (filename: string): Promise<ImportablesResult> => {
      return axios
        .get(`${baseUrl}/importables?filename=${filename}`)
        .then((res) => res.data);
    },
    generateNodeFromPrompt: (
      prompt: string
    ): Promise<{ importablePart: ImportableSource }> => {
      return axios
        .post(`${baseUrl}/generatePart`, { prompt })
        .then((res) => res.data);
    },
  };
};

export type DevServerClient = ReturnType<typeof createDevServerClient>;
