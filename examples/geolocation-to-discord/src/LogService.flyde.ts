import { CodeNode, partInput } from "@flyde/core";
import { storeLog } from "./LogService";

export const LogPart: CodeNode = {
  id: "Log Service",
  inputs: {
    data: partInput(),
  },
  outputs: {},
  run: async ({ data }) => {
    return storeLog(data);
  },
};
