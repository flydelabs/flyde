import { CodePart, partInput } from "@flyde/core";
import { storeLog } from "./LogService";

export const historyLog: CodePart = {
    id: 'History Log',
    inputs: {
        data: partInput('required'),
    },
    outputs: {},
    async fn(inputs) {
        return storeLog(inputs.data);
    }
}