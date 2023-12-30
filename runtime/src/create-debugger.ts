import { Debugger } from "@flyde/core";
import {
  createRuntimeClient,
  RuntimeDebuggerClient,
} from "@flyde/remote-debugger/dist/clients/runtime";
import { debugLogger } from "./logger";

const withTimeout = <T>(promise: Promise<T>, timeout: number): Promise<T> => {
  return new Promise((res, rej) => {
    const timeoutId = setTimeout(() => {
      rej(new Error("Timeout"));
    }, timeout);

    promise.then(
      (data) => {
        clearTimeout(timeoutId);
        res(data);
      },
      (e) => rej(e)
    );
  });
};

export const createDebugger = async (
  debuggerUrl: string,
  executionId: string,
  executionDelay?: number
): Promise<Debugger> => {
  debugLogger("Creating runtime debugger");
  let client: RuntimeDebuggerClient;
  try {
    client = createRuntimeClient(debuggerUrl, executionId);
    await withTimeout(client.waitForConnection(), 1000);

    const _debugger: Debugger = {
      onEvent: (e) => {
        debugLogger(`Emitting event ${e.type} on ${e.insId}`);
        client.emitEvent({ ...e, executionId });
      },
      destroy: () => {
        return client.destroy();
      },
      debugDelay: executionDelay,
    };

    return _debugger;
  } catch (e) {
    client?.destroy();
    debugLogger("Error: Failed to create debugger %o", e);
    return undefined;
  }
};
