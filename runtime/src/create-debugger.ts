import { Debugger } from "@flyde/core";
import { createRuntimeClient } from "@flyde/remote-debugger/dist/clients/runtime";

const url = 'http://localhost:8545';

export const createDebugger = async () => {
    return createRuntimeClient(url, 'bob').then((client) => {
        const _debugger: Debugger = {
            onInput: (wrappedValue) => {
                return client.emitInputChange(wrappedValue);
            },
            onOutput: (val) => {
                return client.emitOutputChange(val);
            },
            onProcessing: (val) => {
                return client.emitProcessing(val);
            },
            onInputsStateChange: (val) => {
                return client.emitInputsStateChange(val);
            },
            onError: (data) => {
                return client.emitPartError(data);
            },
        };
    
        return _debugger;
    })
    .catch(() => undefined)
}