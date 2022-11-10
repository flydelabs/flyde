import { DevServerClient } from "@flyde/dev-server";
import { EditorPorts, toastMsg } from "@flyde/flow-editor";
import { useHistory } from "react-router";


export type WebPortsConfig = {
    devServerClient: DevServerClient,
    history: ReturnType<typeof useHistory>
} 

export const createWebPorts = ({devServerClient, history}: WebPortsConfig) : EditorPorts => {

    return {
        prompt: async ({text, defaultValue}) => {
            return prompt(text, defaultValue)
        },
        openFile: async ({absPath}) => {
            const params = new URLSearchParams(history.location.search);
            params.set('fileName', absPath);
            const newUrl = decodeURIComponent(`${location.pathname}?${params}`);
            toastMsg(newUrl);
            history.push(newUrl);
        },
        readFlow: async ({absPath}) => {
            return devServerClient.readFile(absPath);
        },
        saveFlow: async ({absPath, flow}) => {
            await devServerClient.saveFile(absPath, flow);
        },
        resolveDeps: async ({absPath}) => {
            return devServerClient.resolveDefinitions(absPath);
        },
        getImportables: async ({rootFolder}) => {
            return devServerClient.getImportables(rootFolder);
        },
        onFlowChange: () => {
            console.log('Not implemented');
            return () => {

            }
        }
    }
}