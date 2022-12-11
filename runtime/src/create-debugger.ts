import { Debugger } from "@flyde/core";
import { createRuntimeClient } from "@flyde/remote-debugger/dist/clients/runtime";
import { debugLogger } from "./logger";

const url = "http://localhost:8545";

export const createDebugger = async (): Promise<Debugger> => {
  return createRuntimeClient(url, "n/a")
    .then((client) => {
      const _debugger: Debugger = {
        onEvent: (e) => {
          debugLogger(`Emitting event ${e.type} on ${e.insId}`);
          client.emitEvent(e)
        },
        destroy: () => {
          return client.destroy();
        },
      };

      return _debugger;
    })
    .catch(() => undefined);
};
