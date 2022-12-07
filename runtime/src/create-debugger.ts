import { Debugger } from "@flyde/core";
import { createRuntimeClient } from "@flyde/remote-debugger/dist/clients/runtime";

const url = "http://localhost:8545";

export const createDebugger = async (): Promise<Debugger> => {
  return createRuntimeClient(url, "bob")
    .then((client) => {
      const _debugger: Debugger = {
        onEvent: e => client.emitEvent(e),
      destroy: () => {
          return client.destroy();
        },
      };

      return _debugger;
    })
    .catch(() => undefined);
};
