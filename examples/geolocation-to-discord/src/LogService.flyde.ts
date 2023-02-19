import { CodePart, partInput } from "@flyde/core";
import { storeLog } from "./LogService";

export const LogPart: CodePart = {
    id: "Log Service",
    inputs: {
        data: partInput()
    },
    outputs: {},
    fn: async ({ data }) => {
        return storeLog(data);
    }
}