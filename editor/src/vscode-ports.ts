import { EditorPorts } from "@flyde/flow-editor";
import cuid from "cuid";


export type EditorPortType = keyof EditorPorts;

type Awaited<T> = T extends PromiseLike<infer U> ? U : T


type EmitterFn = (...params: any) => Promise<any>;
type ListenerFn = (cb: (...params: any) =>Promise<any> ) => void;

type PortFn = EmitterFn | ListenerFn;

type PortConfig<T extends PortFn> = {
    request: Parameters<T>,
    response: ReturnType<Awaited<T>>
}


type PostMsgConfig = {
    [Property in keyof EditorPorts]: PortConfig<EditorPorts[Property]>;
};


let vscodeApi: any;

const safelyAcquireApi = () => {
    if (vscodeApi) {
        return vscodeApi;
    } 

    const fn = (window as any).acquireVsCodeApi;
    try {
        const api = fn();
        vscodeApi = api;
        return api;
    } catch (e) {
        return;
    }
}

export const postMessageCallback = (type: string, params: any): Promise<any> => {
    const requestId = cuid();
    const vscode = safelyAcquireApi();
    vscode.postMessage({type, params, requestId, source: 'app'}, '*');
    return new Promise((res) => {
        const handler = (event: MessageEvent) => {
            const {data} = event;
            if (data && data.type === type && data.requestId === requestId) {
                res(event.data.payload);
                window.removeEventListener('message', handler);
            }
        }
        window.addEventListener('message', handler);
    });
}


export const createVsCodePorts = (): EditorPorts => {

    return {
        prompt: ({text, defaultValue}) => {
            return postMessageCallback('prompt', {text, defaultValue});
        },
        openFile: async (dto) => {
            return postMessageCallback('openFile', dto);
        },
        readFlow: async (dto) => {
            return postMessageCallback('readFlow', dto);
        },
        saveFlow: async (dto) => {
            return postMessageCallback('saveFlow', dto);
        },
        resolveDeps: async (dto) => {
            return postMessageCallback('resolveDeps', dto)
        },
        getImportables: async (dto) => {
            return postMessageCallback('getImportables', dto)
        },
        onFlowChange: (cb) => {
            const handler = (event: MessageEvent) => {
                const {data} = event;
                if (data.type  === 'onFlowChange') {
                    cb(data.params);
                }
            }
            window.addEventListener('message', handler);
    
            return () => {
                window.removeEventListener('message', handler);
            }
        }
    }
}
