import path = require("path");
import * as vscode from "vscode";
import { getWebviewContent } from "./editor/open-flyde-panel";
var fp = require("find-free-port");

import { scanImportableNodes, generateAndSaveNode } from "./embedded-server";
import { getBaseNodesLibraryData } from "@flyde/nodes/dist/nodes-library-data";

import {
  deserializeFlow,
  serializeFlow,
  resolveEditorInstance,
  createServerReferencedNodeFinder,
  resolveEditorNode,
} from "@flyde/loader";
import {
  FlydeFlow,
  MAJOR_DEBUGGER_EVENT_TYPES,
  extractInputsFromValue,
  formatEvent,
  keys,
  configurableValue,
  replaceInputsInValue,
  ImportableEditorNode,
  codeNodeToImportableEditorNode,
  VisualNode,
  EditorVisualNode,
} from "@flyde/core";
import { findPackageRoot } from "./find-package-root";
import { randomInt } from "crypto";
import { reportEvent, reportException } from "./analytics";

import { Uri } from "vscode";

import { EmbeddedFlowRunner } from "./embedded-server";
import { createEditorClient } from "@flyde/editor";
import { maybeAskToStarProject } from "./maybeAskToStarProject";
import { customCodeNodeFromCode } from "@flyde/core/dist/misc/custom-code-node-from-code";
import { createAiCompletion } from "./ai";
import { getAvailableSecrets, addNewSecret, getSecrets } from "./secretsService";

// Helper functions
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

const tryOrThrow = <T>(fn: () => T, msg: string): T | Error => {
  try {
    return fn();
  } catch (e) {
    console.error(`Error editor error: ${msg}. Full error:`, e);

    return new Error(`Flyde editor error: ${msg}: ${e}`);
  }
};

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
  implements vscode.CustomTextEditorProvider {
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

  constructor(private readonly context: vscode.ExtensionContext) { }

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
      webviewPanel.webview.postMessage({
        type: event.type,
        requestId: event.requestId,
        status: "success",
        payload,
        source: "extension",
      });
    };

    const messageError = (event: FlydePortMessage<any>, error: unknown) => {
      const normalizedError =
        error instanceof Error ? error : new Error(String(error));
      console.info(
        "Sending error to webview",
        event.type,
        event.requestId,
        normalizedError.message
      );
      webviewPanel.webview.postMessage({
        type: event.type,
        requestId: event.requestId,
        status: "error",
        payload: {
          message: normalizedError.message,
          stack: normalizedError.stack,
        },
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

      const errors = [initialFlow]
        .filter((obj) => obj instanceof Error)
        .map((err: Error) => err.message);

      if (errors.length) {
        webviewPanel.webview.html = `Errors: <code>${errors.join(
          "\n"
        )}</code><hr/>Try opening it with a text editor and fix the problem`;
        return initialFlow as any;
      }

      const node = initialFlow as FlydeFlow;

      const resolvedNode = tryOrThrow(() => {
        return resolveEditorNode(node.node, createServerReferencedNodeFinder(fullDocumentPath));
      }, "Failed to resolve node");

      if (resolvedNode instanceof Error) {
        webviewPanel.webview.html = `Errors: <code>${resolvedNode.message}</code><hr/>Try opening it with a text editor and fix the problem`;
        return;
      }

      // used to avoid triggering "onChange" of the same webview
      webviewPanel.webview.html = await getWebviewContent({
        extensionUri: this.context.extensionUri,
        relativeFile: relative,
        port: this.params.port,
        webview: webviewPanel.webview,
        initialNode: resolvedNode,
        webviewId,
        executionId,
        darkMode: this.params.darkMode,
      });

      lastFlow = initialFlow as FlydeFlow;

      lastWebview = webviewPanel.webview;
    };

    await renderWebview();
    reportEvent("renderedWebview", { webviewId });

    vscode.commands.executeCommand("setContext", "flyde.flowLoaded", true);

    const _debugger = createEditorClient(
      `http://localhost:${this.params.port}`,
      executionId
    );

    const flowRunner = new EmbeddedFlowRunner(this.params.port);

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

              case "generateNodeFromPrompt": {
                const config = vscode.workspace.getConfiguration("flyde");
                let openAiToken = config.get<string>("openAiToken");

                if (!openAiToken) {
                  await vscode.commands.executeCommand("flyde.setOpenAiToken");
                  openAiToken = config.get<string>("openAiToken");
                }

                if (!openAiToken) {
                  throw new Error("OpenAI token is required");
                }

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

                const node = flow.node as EditorVisualNode;

                function cleanNode(node: EditorVisualNode): VisualNode {
                  const newNode: VisualNode = node;

                  node.instances.forEach((instance, idx) => {
                    if (instance.type === "code") {
                      const { node: _, ...rest } = instance;
                      newNode.instances[idx] = rest;
                    } else if (instance.type === "visual") {

                      const { node: _, ...rest } = instance;

                      newNode.instances[idx] = rest;


                      if (instance.source.type === "inline") {
                        const inlineVisualNode = instance.source.data as EditorVisualNode;
                        const newData = cleanNode(inlineVisualNode);
                        newNode.instances[idx] = {
                          ...rest,
                          source: {
                            ...instance.source,
                            data: newData,
                          },
                        };
                      }
                    }
                  });

                  return newNode;
                }

                const serialized = serializeFlow({ node: cleanNode(node) });
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
                    ? "yarn add @flyde/loader"
                    : "npm install @flyde/loader";

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

                const secrets = await getSecrets();
                const job = await flowRunner.forkRunFlow({
                  runFlowParams: [
                    lastFlow,
                    fullDocumentPath,
                    event.params.inputs,
                    this.params.port,
                    event.params.executionDelay,
                    secrets
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
                const libraryData = getBaseNodesLibraryData();

                try {
                  const firstWorkspace =
                    vscode.workspace.workspaceFolders &&
                    vscode.workspace.workspaceFolders[0];
                  const rootPath = firstWorkspace
                    ? firstWorkspace.uri.fsPath
                    : path.dirname(fullDocumentPath);
                  const relativePath = path.relative(rootPath, fullDocumentPath);

                  const { nodes } = await scanImportableNodes(
                    rootPath,
                    relativePath
                  );

                  const categorizedNodeIds = new Set<string>();

                  const localNodes: ImportableEditorNode[] = [];

                  Object.entries(libraryData).forEach(
                    ([_, categoryNodes]) => {
                      // Track all stdlib nodes that are already categorized
                      categoryNodes.forEach((node: ImportableEditorNode) => {
                        categorizedNodeIds.add(node.id);
                      });
                    }
                  );

                  nodes.forEach((node: ImportableEditorNode) => {
                    if (
                      node.type === "code" &&
                      node.source.type === "file" &&
                      !categorizedNodeIds.has(node.id)
                    ) {
                      localNodes.push(node);
                      categorizedNodeIds.add(node.id);
                    } else if (
                      node.type === "visual" &&
                      node.source.type === "file" &&
                      !categorizedNodeIds.has(node.id)
                    ) {
                      localNodes.push(node);
                      categorizedNodeIds.add(node.id);
                    }
                  });

                  // 3. Create Other category for stdlib nodes that aren't in main categories
                  const otherNodes: ImportableEditorNode[] = [];
                  nodes.forEach((node: ImportableEditorNode) => {
                    if (
                      node.type === "code" &&
                      node.source.type === "package" &&
                      node.source.data === "@flyde/stdlib" &&
                      !categorizedNodeIds.has(node.id)
                    ) {
                      otherNodes.push(node);
                    }
                  });

                  if (localNodes.length > 0) {
                    libraryData.groups.push({
                      title: "Local",
                      nodes: localNodes,
                    });
                  }

                  if (otherNodes.length > 0) {
                    libraryData.groups.push({
                      title: "Other",
                      nodes: otherNodes,
                    });
                  }

                  messageResponse(event, libraryData);
                } catch (error) {
                  console.error("Error getting library data:", error);
                  messageError(event, error);
                }
                break;
              }
              case "onRequestSiblingNodes": {
                // TODO - re-implement
                throw new Error("Not implemented");
                break;
              }
              case "onCreateCustomNode": {
                const { code } = event.params;

                const node = customCodeNodeFromCode(code, undefined, {
                  // eslint-disable-next-line @typescript-eslint/naming-convention
                  "@flyde/core": {
                    configurableValue: configurableValue,
                    extractInputsFromValue: extractInputsFromValue,
                    replaceInputsInValue: replaceInputsInValue,
                  },
                });
                const flowDir = path.dirname(fullDocumentPath);
                const nodeFileName = `${node.id}.flyde.ts`;
                const nodeFilePath = path.join(flowDir, nodeFileName);

                try {
                  await vscode.workspace.fs.writeFile(
                    vscode.Uri.file(nodeFilePath),
                    Buffer.from(code)
                  );
                  const editorNode = codeNodeToImportableEditorNode(node, {
                    type: "file",
                    data: nodeFileName,
                  });
                  vscode.window.showInformationMessage(
                    `Custom node saved as ${nodeFileName}`
                  );
                  messageResponse(event, editorNode);
                } catch (error) {
                  console.error("Error saving custom node file:", error);
                  vscode.window.showErrorMessage(
                    `Failed to save custom node: ${error instanceof Error ? error.message : "Unknown error"
                    }`
                  );

                  messageError(event, error);
                  return;
                }
                break;
              }
              case "createAiCompletion": {
                try {
                  const { prompt, jsonMode, nodeId, insId } = event.params;
                  const completion = await createAiCompletion({
                    prompt,
                    jsonMode,
                    nodeId,
                    insId
                  });
                  messageResponse(event, completion);
                } catch (error) {
                  console.error(`Error creating AI completion`, error);
                  messageError(event, error);
                }
                break;
              }
              case "resolveInstance": {
                const { instance } = event.params;

                const referencedNodeFinder =
                  createServerReferencedNodeFinder(fullDocumentPath);

                try {
                  const editorInstance = resolveEditorInstance(
                    instance,
                    referencedNodeFinder
                  );
                  console.log("editorInstance", editorInstance);
                  messageResponse(event, editorInstance);
                } catch (err) {
                  console.error(
                    "Error resolving instance",
                    instance,
                    err instanceof Error ? err.stack : err
                  );
                  messageError(event, err);
                }

                break;
              }
              case "getAvailableSecrets": {
                try {
                  const secrets = await getAvailableSecrets(fullDocumentPath);
                  messageResponse(event, secrets);
                } catch (error) {
                  console.error("Error getting available secrets:", error);
                  messageResponse(event, []);
                }
                break;
              }
              case "addNewSecret": {
                try {
                  const { key, value } = event.params;
                  const secrets = await addNewSecret(key, value, fullDocumentPath);
                  vscode.window.showInformationMessage(
                    `Secret "${key}" was successfully added to .env file`
                  );
                  messageResponse(event, secrets);
                } catch (error) {
                  console.error("Error adding new secret:", error);
                  messageError(event, error);
                }
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
          } catch (err) {
            const error =
              err instanceof Error ? err : new Error(`Unknown error: ${err}`);
            console.error(`Error while handling message from webview`, error);
            reportException(error, {
              source: "webviewPanel.webview.onDidReceiveMessage",
            });
            vscode.window.showErrorMessage(
              `Unexpected error while handling message from webview: ${error.message}`
            );
            // Send error response back to client
            messageError(event, error);
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
          webviewPanel.webview.postMessage({
            type: "onExternalFlowChange",
            requestId: "TODO-cuid",
            params: { flow },
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
