import { Debugger } from "@flyde/core";
import { createRuntimeClient, RuntimeDebuggerClient } from "@flyde/remote-debugger/dist/clients/runtime";
import { debugLogger } from "./logger";

const url = "http://localhost:8545";

const withTimeout = <T>(promise: Promise<T>, timeout: number): Promise<T> => {
  return new Promise((res, rej) => {
    const timeoutId = setTimeout(() => {
      rej(new Error("Timeout"));
    }, timeout);

    promise.then((data) => {
      clearTimeout(timeoutId);
      res(data);
    }, e => rej(e));
  });
};

export const createDebugger = async (): Promise<Debugger> => {

  debugLogger("Creating runtime debugger")
  let client: RuntimeDebuggerClient;
  try {

    client = createRuntimeClient(url, "n/a");
    await withTimeout(client.waitForConnection(), 1000);
    
    const _debugger: Debugger = {
      onEvent: (e) => {
        debugLogger(`Emitting event ${e.type} on ${e.insId}`);
        client.emitEvent(e);
      },
      destroy: () => {
        return client.destroy();
      },
    };

    return _debugger;
  } catch (e) {
    client?.destroy();
    debugLogger("Error: Failed to create debugger %o", e);
    return undefined;
  }
  
};
