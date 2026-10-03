import { eventually } from "@flyde/core";
import * as vscode from "vscode";
import { getLastWebviewForTests } from "../flydeEditor";
import * as assert from "assert";

async function getLastWebview(): Promise<vscode.Webview> {
  await eventually(() => assert(!!getLastWebviewForTests()));
  return getLastWebviewForTests()!;
}

export type WebViewTestingCommands = {
  $$: {
    params: { selector: string };
    response: { innerHTML: string; textContent: string }[];
  };
  click: { params: { selector: string }; response: void };
  clickByText: { params: { text: string; tagName?: string }; response: void };
  type: { params: { selector: string; text: string }; response: void };
  hasText: { params: { selector: string; text: string }; response: boolean };
  getDebuggerEvents: {
    params: {};
    response: any[];
  };
};

let nextTestingRequestId = 0;

export async function webviewTestingCommand<
  T extends keyof WebViewTestingCommands
>(
  command: T,
  params: WebViewTestingCommands[T]["params"]
): Promise<WebViewTestingCommands[T]["response"]> {
  const webview = await getLastWebview();
  const testingRequestId = ++nextTestingRequestId;
  return new Promise((res, rej) => {
    const timer = setTimeout(() => {
      listener.dispose();
      rej(new Error(`Webview did not answer ${command} within 1000ms`));
    }, 1000);
    const listener = webview.onDidReceiveMessage((message) => {
      if (message.type === "__webviewTestingResponse" && message.testingRequestId === testingRequestId) {
        clearTimeout(timer);
        listener.dispose();
        if (message.error) {
          rej(message.error);
        } else {
          res(message.response);
        }
      }
    });

    webview.postMessage({
      type: "__webviewTestingCommand",
      testingRequestId,
      command,
      params,
    });
  });
}
