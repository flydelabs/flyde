import path = require("path");
import * as vscode from "vscode";
import { getWebviewContent } from "./editor/open-flyde-panel";
var fp = require("find-free-port");

import { scanImportableNodes } from "@flyde/dev-server/dist/service/scan-importable-nodes";
import { generateAndSaveNode } from "@flyde/dev-server/dist/service/generate-node-from-prompt";
import { getLibraryData } from "@flyde/dev-server/dist/service/get-library-data";

import {
  deserializeFlow,
  resolveFlow,
  resolveFlowByPath,
  serializeFlow,
} from "@flyde/resolver";
import {
  FlydeFlow,
  MAJOR_DEBUGGER_EVENT_TYPES,
  formatEvent,
  keys,
} from "@flyde/core";
import { findPackageRoot } from "./find-package-root";
import { randomInt } from "crypto";
import { reportEvent, reportException } from "./telemetry";

import { Uri } from "vscode";
import { FlowJob } from "@flyde/dev-server";

import { forkRunFlow } from "@flyde/dev-server/dist/runner/runFlow.host";
import { createEditorClient } from "@flyde/remote-debugger";
import { maybeAskToStarProject } from "./maybeAskToStarProject";

// export type EditorPortType = keyof any;

type Awaited<T> = T extends PromiseLike<infer U> ? U : T;

type EmitterFn = (...params: any) => Promise<any>;
type ListenerFn = (cb: (...params: any) => Promise<any>) => void;

type PortFn = EmitterFn | ListenerFn;

type PortConfig<T extends PortFn> = {
  request: Parameters<T>;
  response: ReturnType<Awaited<T>>;
};

// type PostMsgConfig = {
//     [Property in keyof any]: PortConfig<EditorPorts[Property]>;
// };

type FlydePortMessage<T extends any> = {
  type: T;
  requestId: string;
  params: any; // PostMsgConfig[T]['params']
};

const tryOrThrow = (fn: Function, msg: string) => {
  try {
    return fn();
  } catch (e) {
    console.error(`Error editor error: ${msg}. Full error:`, e);

    return new Error(`Flyde editor error: ${msg}: ${e}`);
  }
};

let runningJobs = <{ [webviewId: string]: FlowJob }>{};

let lastWebview: any = null;

export const getLastWebviewForTests = () => {
  return lastWebview;
};

export interface FlydeEditorProviderParams {
  port: number;
  mainOutputChannel: vscode.OutputChannel;
  debugOutputChannel: vscode.OutputChannel;
  darkMode: boolean;
}

export class FlydeEditorEditorProvider
  implements vscode.CustomTextEditorProvider
{
  params!: FlydeEditorProviderParams;

  public static register(
    context: vscode.ExtensionContext,
    params: FlydeEditorProviderParams
  ): vscode.Disposable {
    const provider = new FlydeEditorEditorProvider(context);

    provider.params = params;

    const providerRegistration = vscode.window.registerCustomEditorProvider(
      FlydeEditorEditorProvider.viewType,
      provider
    );

    return providerRegistration;
  }

  private static readonly viewType = "flydeEditor";

  constructor(private readonly context: vscode.ExtensionContext) {}

  public async resolveCustomTextEditor(
    document: vscode.TextDocument,
    webviewPanel: vscode.WebviewPanel,
    _token: vscode.CancellationToken
  ): Promise<void> {
    // Setup initial content for the webview
    webviewPanel.webview.options = {
      enableScripts: true,
      portMapping: [
        {
          webviewPort: 3000,
          extensionHostPort: 3000,
        },
      ],
    };

    const firstWorkspace =
      vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders[0];
    const fileRoot = firstWorkspace ? firstWorkspace.uri.fsPath : "";

    const relative = path.relative(fileRoot, document.fileName);

    let lastSaveBy = "";

    let lastFlow: FlydeFlow;

    const messageResponse = (event: FlydePortMessage<any>, payload: any) => {
      console.info(
        "Responding to message from webview",
        event.type,
        event.requestId,
        payload
      );
      webviewPanel.webview.postMessage({
        type: event.type,
        requestId: event.requestId,
        payload,
        source: "extension",
      });
    };

    const webviewId = `wv-${(Date.now() + randomInt(999)).toString(32)}`;

    const fullDocumentPath = document.uri.fsPath;
    const executionId = fullDocumentPath;

    const renderWebview = async () => {
      const raw = document.getText();
      const fileName = (
        document.uri.fsPath.split(path.sep).pop() ?? "Default"
      ).replace(".flyde", "");
      const initialFlow = tryOrThrow(() => {
        return raw.trim() !== ""
          ? deserializeFlow(raw, fullDocumentPath)
          : {
              node: {
                id: fileName,
                inputs: {},
                inputsPosition: {},
                outputs: {},
                outputsPosition: {},
                instances: [],
                connections: [],
              },
              imports: {},
            };
      }, "Failed to deserialize flow");
      const dependencies = tryOrThrow(
        () =>
          resolveFlow(initialFlow, "definition", fullDocumentPath).dependencies,
        "Failed to resolve flow's dependencies"
      );

      const errors = [initialFlow, dependencies]
        .filter((obj) => obj instanceof Error)
        .map((err: Error) => err.message);

      if (errors.length) {
        webviewPanel.webview.html = `Errors: <code>${errors.join(
          "\n"
        )}</code><hr/>Try opening it with a text editor and fix the problem`;
        return initialFlow as any;
      }

      // used to avoid triggering "onChange" of the same webview
      webviewPanel.webview.html = await getWebviewContent({
        extensionUri: this.context.extensionUri,
        relativeFile: relative,
        port: this.params.port,
        webview: webviewPanel.webview,
        initialFlow,
        dependencies,
        webviewId,
        executionId,
        darkMode: this.params.darkMode,
      });

      lastFlow = initialFlow;

      lastWebview = webviewPanel.webview;
    };

    await renderWebview();
    reportEvent("renderedWebview", { webviewId });

    vscode.commands.executeCommand("setContext", "flyde.flowLoaded", true);

    const _debugger = createEditorClient(
      `http://localhost:${this.params.port}`,
      executionId
    );

    _debugger.onBatchedEvents((events) => {
      const { mainOutputChannel, debugOutputChannel } = this.params;
      events.forEach((event) => {
        debugOutputChannel.appendLine(formatEvent(event));
        if (!event.ancestorsInsIds) {
          if (MAJOR_DEBUGGER_EVENT_TYPES.includes(event.type)) {
            mainOutputChannel.appendLine(formatEvent(event));
          }
        }
      });
    });

    let didFocusOutput = false;

    webviewPanel.webview.onDidReceiveMessage(
      async (event: FlydePortMessage<any>) => {
        if (event.type && event.requestId) {
          console.info(
            "Received message from webview",
            event.type,
            event.requestId
          );

          try {
            switch (event.type) {
              case "prompt": {
                const { defaultValue, text } = event.params;
                const value = await vscode.window.showInputBox({
                  value: defaultValue,
                  prompt: text,
                });
                messageResponse(event, value);
                break;
              }
              case "confirm": {
                const { text } = event.params;
                const res = await vscode.window.showInformationMessage(
                  text,
                  "Yes",
                  "No"
                );
                messageResponse(event, res === "Yes");
                break;
              }
              case "openFile": {
                const { absPath } = event.params;
                const uri = vscode.Uri.parse(absPath);

                const isFlydeFlow = absPath.endsWith(".flyde");
                if (isFlydeFlow) {
                  const res = await vscode.commands.executeCommand(
                    "vscode.openWith",
                    uri,
                    "flydeEditor"
                  );
                  messageResponse(event, res);
                } else {
                  const activeColumn =
                    vscode.window.activeTextEditor?.viewColumn; // without passing the active column it seems to override the tab with the selection
                  const res = await vscode.commands.executeCommand(
                    "vscode.open",
                    uri,
                    activeColumn
                  );
                  messageResponse(event, res);
                }
                break;
              }
              case "readFlow": {
                const raw = document.getText();
                const flow = deserializeFlow(raw, fullDocumentPath);
                messageResponse(event, flow);
                break;
              }

              case "resolveDeps": {
                const { flow: dtoFlow } = event.params;

                if (dtoFlow) {
                  const deps = resolveFlow(
                    dtoFlow,
                    "definition",
                    fullDocumentPath
                  ).dependencies;
                  messageResponse(event, deps);
                } else {
                  const flow = resolveFlowByPath(
                    fullDocumentPath,
                    "definition"
                  );
                  messageResponse(event, flow);
                }
                break;
              }
              case "generateNodeFromPrompt": {
                const config = vscode.workspace.getConfiguration("flyde");
                const openAiToken = config.get<string>("openAiToken");

                const { prompt } = event.params;
                if (prompt.trim().length === 0) {
                  throw new Error("prompt is empty");
                }
                const targetPath = Uri.joinPath(document.uri, "..");
                const importableNode = await generateAndSaveNode(
                  targetPath.fsPath,
                  prompt,
                  openAiToken
                );

                messageResponse(event, { importableNode });
                break;
              }
              case "setFlow": {
                const { flow } = event.params;
                const serialized = serializeFlow(flow);
                lastFlow = flow;
                const edit = new vscode.WorkspaceEdit();

                // replacing everything for simplicity. TODO - pass only delta changes
                const range = new vscode.Range(0, 0, document.lineCount, 0);
                edit.replace(document.uri, range, serialized);
                lastSaveBy = webviewId;
                await vscode.workspace.applyEdit(edit);
                messageResponse(event, undefined);
                break;
              }
              case "getImportables": {
                const maybePackageRoot = await findPackageRoot(document.uri);
                const root =
                  maybePackageRoot ?? Uri.joinPath(document.uri, "..");

                const deps = await scanImportableNodes(
                  root.fsPath,
                  path.relative(root.fsPath, fullDocumentPath)
                );
                messageResponse(event, deps);
                break;
              }
              case "onInstallRuntimeRequest": {
                // show vscode selection dialog between "use yarn" and "use npm"
                const res = await vscode.window.showQuickPick(
                  ["Use Yarn", "Use NPM"],
                  {
                    placeHolder: "How do you want to install the runtime?",
                  }
                );

                const command =
                  res === "Use Yarn"
                    ? "yarn add @flyde/runtime"
                    : "npm install @flyde/runtime";

                // notify user
                vscode.window.showInformationMessage(
                  `Running \`${command}\` from the integrated terminal. This may take a while. You can follow the progress in the terminal`
                );

                // create a terminal
                const terminal = vscode.window.createTerminal({
                  name: "Flyde Runtime Installer",
                });

                // run the command
                await terminal.show();
                await terminal.sendText(command);
                break;
              }
              case "onRunFlow": {
                reportEvent("runFlow:before", {
                  inputsCount: `${keys(event.params.inputs).length}`,
                });
                const job = await forkRunFlow({
                  runFlowParams: [
                    lastFlow,
                    fullDocumentPath,
                    event.params.inputs,
                    this.params.port,
                    event.params.executionDelay,
                  ],
                  cwd: vscode.workspace.workspaceFolders?.[0].uri.fsPath,
                });
                reportEvent("runFlow:after");

                setTimeout(() => {
                  maybeAskToStarProject(5000);
                }, 10000);

                vscode.commands.executeCommand(
                  "setContext",
                  "flyde.ranFlow",
                  true
                );
                if (!didFocusOutput) {
                  didFocusOutput = true;
                  this.params.mainOutputChannel?.show();
                  this.params.mainOutputChannel?.appendLine(
                    `Running flow. Events will appear here. You can also hover the inputs and output pins to view data.`
                  );
                }

                return job;
              }
              case "hasOpenAiToken": {
                const config = vscode.workspace.getConfiguration("flyde");
                const openAiToken = config.get<string>("openAiToken");
                messageResponse(event, !!openAiToken);
              }
              case "reportEvent": {
                const { name, data } = event.params;
                reportEvent(`flowEditor:${name}`, { ...data, webviewId });
                break;
              }
              case "getLibraryData": {
                const libraryData = getLibraryData();
                messageResponse(event, libraryData);
                break;
              }
              default: {
                reportEvent("onDidReceiveMessage: unknown message", {
                  type: event.type,
                  webviewId: webviewId,
                });
                vscode.window.showErrorMessage(
                  `Handling of  ${event.type} is not implemented yet`
                );
                break;
              }
            }
          } catch (err: unknown) {
            const error =
              err instanceof Error ? err : new Error(`Unknown error: ${err}`);
            console.error(`Error while handling message from webview`, error);
            reportException(error, {
              source: "webviewPanel.webview.onDidReceiveMessage",
            });
            vscode.window.showErrorMessage(
              `Unexpected error while handling message from webview: ${error.message}`
            );
          }
        }
      }
    );

    webviewPanel.onDidChangeViewState(async (e) => {
      // when the webview is refocused, it needs to receive a new html to contain the correct initial flow
      if (e.webviewPanel.active) {
        await renderWebview();
      }
    });

    const changeDocumentSubscription = vscode.workspace.onDidChangeTextDocument(
      (e) => {
        const isSameUri = e.document.uri.toString() === document.uri.toString();

        if (isSameUri && lastSaveBy !== webviewId) {
          const raw = document.getText();
          const flow: FlydeFlow = deserializeFlow(raw, fullDocumentPath);
          const deps = resolveFlow(
            flow,
            "definition",
            fullDocumentPath
          ).dependencies;
          webviewPanel.webview.postMessage({
            type: "onExternalFlowChange",
            requestId: "TODO-cuid",
            params: { flow, deps },
            source: "extension",
          });
        }
      }
    );

    // Make sure we get rid of the listener when our editor is closed.
    webviewPanel.onDidDispose(() => {
      changeDocumentSubscription.dispose();
    });
  }

  /**
   * Get the static html used for the editor webviews.
   */
}
