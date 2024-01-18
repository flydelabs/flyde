import { EditorPorts } from "@flyde/flow-editor";
import { slug } from "cuid";

export type EditorPortType = keyof EditorPorts;

let vscodeApi: any;

const safelyAcquireApi = () => {
  if (vscodeApi) {
    return vscodeApi;
  }

  const fn = (window as any).acquireVsCodeApi;
  try {
    const api = fn();
    vscodeApi = api;
    return api;
  } catch (e) {
    return;
  }
};

export const postMessageCallback = (
  type: string,
  params: any
): Promise<any> => {
  const requestId = slug();
  const vscode = safelyAcquireApi();
  vscode.postMessage({ type, params, requestId, source: "app" }, "*");
  return new Promise((res) => {
    const handler = (event: MessageEvent) => {
      const { data } = event;
      if (data && data.type === type && data.requestId === requestId) {
        res(event.data.payload);
        window.removeEventListener("message", handler);
      }
    };
    window.addEventListener("message", handler);
  });
};

export const createVsCodePorts = (): EditorPorts => {
  return {
    prompt: ({ text, defaultValue }) => {
      return postMessageCallback("prompt", { text, defaultValue });
    },
    confirm: ({ text }) => {
      return postMessageCallback("confirm", { text });
    },
    openFile: async (dto) => {
      return postMessageCallback("openFile", dto);
    },
    readFlow: async (dto) => {
      return postMessageCallback("readFlow", dto);
    },
    setFlow: async (dto) => {
      return postMessageCallback("setFlow", dto);
    },
    resolveDeps: async (dto) => {
      return postMessageCallback("resolveDeps", dto);
    },
    getImportables: async (dto) => {
      return postMessageCallback("getImportables", dto);
    },
    onInstallRuntimeRequest: async () => {
      return postMessageCallback("onInstallRuntimeRequest", {});
    },
    generateNodeFromPrompt: async (dto) => {
      return postMessageCallback("generateNodeFromPrompt", dto);
    },
    onExternalFlowChange: (cb) => {
      const handler = (event: MessageEvent) => {
        const { data } = event;
        if (data.type === "onExternalFlowChange") {
          cb(data.params);
        }
      };
      window.addEventListener("message", handler);

      return () => {
        window.removeEventListener("message", handler);
      };
    },
    onRunFlow: async (inputs, executionDelay) => {
      return postMessageCallback("onRunFlow", { inputs, executionDelay });
    },
    onStopFlow: async () => {
      return postMessageCallback("onStopFlow", {});
    },
    reportEvent: (name, data) => {
      return postMessageCallback("reportEvent", { name, data });
    },
    hasOpenAiToken: async () => {
      return postMessageCallback("hasOpenAiToken", {});
    },
    getLibraryData: async () => {
      return postMessageCallback("getLibraryData", {});
    },
  };
};

// back-door for testing purposes
window.addEventListener("message", (event) => {
  const { data } = event;
  if (data && data.type === "__webviewTestingCommand") {
    let response: any;
    let error: any;
    switch (data.command) {
      case "$$": {
        const { selector } = data.params;
        const elements = document.querySelectorAll(selector);
        response = Array.from(elements).map((element) => {
          return {
            html: element.innerHTML,
            text: element.textContent,
            outerHtml: element.outerHTML,
          };
        });
        break;
      }
      case "click": {
        const { selector } = data.params;
        const element = document.querySelector(selector);
        if (element) {
          element.click();
          response = {};
        } else {
          error = `Element not found: ${selector}`;
        }
        break;
      }
      default: {
        error = `Unknown command: ${data.command}`;
      }
    }

    const vscode = safelyAcquireApi();

    vscode.postMessage(
      { type: "__webviewTestingResponse", response, error },
      "*"
    );
  }
});
