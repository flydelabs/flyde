import axios from "axios"
import { CustomPart, ExposedFunctionality, FlydeFlow, GroupedPart, PartDefRepo, Project, ResolvedFlydeFlowDefinition } from '@flyde/core';
import { FlydeFile, FolderStructure } from "./fs-helper/shared";

export const createDevServerClient = (baseUrl: string)  => {
    return {
        readFile: (filename: string): Promise<FlydeFlow> => {
            return axios.get(`${baseUrl}/file?name=${filename}`).then(res => res.data);
        },
        saveFile: async (filename: string, data: FlydeFlow) => {
            return axios.put(`${baseUrl}/file?name=${filename}`, data);
        },
        exposed: async (): Promise<ExposedFunctionality[]> => {
            return axios.get(`${baseUrl}/exposed`).then(res => res.data);
        },
        fileStructure: async (): Promise<FolderStructure> => {
            return axios.get(`${baseUrl}/structure`).then(res => res.data);
        },
        resolveDefinitions: (filename: string): Promise<ResolvedFlydeFlowDefinition> => {
            return axios.get(`${baseUrl}/resolveDefinitions?filename=${filename}`).then(res => res.data);
        },
        getImportables: (filename: string): Promise<Record<string, PartDefRepo>> => {
            return axios.get(`${baseUrl}/importables?filename=${filename}`).then(res => res.data);
        }
    }
}