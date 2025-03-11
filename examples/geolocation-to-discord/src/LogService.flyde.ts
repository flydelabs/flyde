import { InternalCodeNode, nodeInput } from "@flyde/core";
import { storeLog } from "./LogService";

export const LogNode: InternalCodeNode = {
  id: "Log Service",
  inputs: {
    data: nodeInput(),
  },
  outputs: {},
  run: async ({ data }) => {
    return storeLog(data);
  },
};
