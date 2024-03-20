// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";

import { FlydeEditorEditorProvider } from "./flydeEditor";
import * as execa from "execa";

var fp = require("find-free-port");

import { initFlydeDevServer } from "@flyde/dev-server/dist/lib";

import { join } from "path";
import { randomInt } from "@flyde/core";

import TelemetryReporter from "@vscode/extension-telemetry";
import { activateReporter, reportEvent } from "./telemetry";
import path = require("path");

import { Template, getTemplates, scaffoldTemplate } from "./templateUtils";

// the application insights key (also known as instrumentation key)

// telemetry reporter
let reporter: TelemetryReporter;

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed

let server: any;

let process: execa.ExecaChildProcess;

const FLYDE_DEFAULT_SERVER_PORT = 8545;

export function activate(context: vscode.ExtensionContext) {
  // eslint-disable-next-line @typescript-eslint/naming-convention
  const { Uri } = vscode;
  const { fs } = vscode.workspace;

  const firstWorkspace =
    vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders[0];
  const fileRoot = firstWorkspace ? firstWorkspace.uri.fsPath : "";

  // ensure it gets properly disposed. Upon disposal the events will be flushed
  context.subscriptions.push(activateReporter());

  reportEvent("activate");

  const mainOutputChannel = vscode.window.createOutputChannel("Flyde");
  const debugOutputChannel = vscode.window.createOutputChannel("Flyde (Debug)");

  let currentTheme = vscode.window.activeColorTheme;

  let useDarkMode =
    currentTheme.kind !== vscode.ColorThemeKind.Light &&
    currentTheme.kind !== vscode.ColorThemeKind.HighContrastLight;

  vscode.window.onDidChangeActiveColorTheme((theme) => {
    useDarkMode =
      theme.kind !== vscode.ColorThemeKind.Light &&
      theme.kind !== vscode.ColorThemeKind.HighContrastLight;
  });

  fp(FLYDE_DEFAULT_SERVER_PORT).then(([port]: [number]) => {
    reportEvent("devServerStart");

    const editorStaticsRoot = join(__dirname, "../editor-build");
    const cleanServer = initFlydeDevServer({
      port,
      root: fileRoot,
      editorStaticsRoot,
    });

    context.subscriptions.push({
      dispose() {
        cleanServer();
      },
    });

    context.subscriptions.push(
      FlydeEditorEditorProvider.register(context, {
        port,
        mainOutputChannel,
        debugOutputChannel,
        darkMode: useDarkMode,
      })
    );
  });

  const openAsTextHandler = async (uri: vscode.Uri) => {
    const document = await vscode.workspace.openTextDocument(uri);

    // Show the document in the text editor
    await vscode.window.showTextDocument(document);
    reporter.sendTelemetryEvent("openAsText");
  };

  context.subscriptions.push(
    vscode.commands.registerCommand("flyde.openAsText", openAsTextHandler)
  );

  function getWorkspaceRootPath(): vscode.Uri | undefined {
    // Check if there is an open workspace
    if (
      vscode.workspace.workspaceFolders &&
      vscode.workspace.workspaceFolders.length > 0
    ) {
      // Return the path of the first workspace folder
      return vscode.workspace.workspaceFolders[0].uri;
    }
  }

  context.subscriptions.push(
    vscode.commands.registerCommand(
      "flyde.newVisualFlow",
      async (dirName: vscode.Uri) => {
        reportEvent("newVisualFlow:start");
        let folderOrFileUri = dirName ?? getWorkspaceRootPath(); // folder will be undefined when triggered by keybinding

        if (!folderOrFileUri) {
          vscode.window.showErrorMessage("No folder or file selected");
          return;
        }

        const folderStat = await fs.stat(folderOrFileUri);
        const folderUri =
          folderStat.type === vscode.FileType.Directory
            ? folderOrFileUri
            : vscode.Uri.joinPath(folderOrFileUri, "..");

        const templates = getTemplates();

        const template = await vscode.window.showQuickPick<
          Template & { label: string }
        >(
          templates.map((t) => ({
            ...t,
            label: t.name,
            description: t.tags.join(", "),
            detail: t.description,
          }))
        );

        if (!template) {
          vscode.window.showWarningMessage("No template selected, aborting");
          return;
        }

        const fileName = await vscode.window.showInputBox({
          title: "Flow file name",
          value: "NewFlow",
        });

        if (!fileName) {
          vscode.window.showWarningMessage("No file name passed, aborting");
          return;
        }

        const targetPath = Uri.joinPath(folderUri, fileName + ".flyde");

        if (
          (await fs.readFile(targetPath).then(
            () => true,
            () => false
          )) === true
        ) {
          vscode.window.showErrorMessage(`File ${targetPath} already exists!`);
          return;
        }
        try {
          reportEvent("newVisualFlow:before", { template: template.name });
          scaffoldTemplate(template, folderUri.fsPath, fileName);
          vscode.commands.executeCommand(
            "vscode.openWith",
            targetPath,
            "flydeEditor"
          );
          reportEvent("newVisualFlow:success", { template: template.name });
          vscode.window.showInformationMessage(
            `New flow created at ${fileName}.flyde!`
          );
        } catch (error) {
          vscode.window.showErrorMessage(`Error creating flow: ${error}`);
        }
      }
    )
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("flyde.setOpenAiToken", async () => {
      const token = await vscode.window.showInputBox({
        title: "OpenAI API Token",
        value: "",
      });

      if (!token) {
        vscode.window.showWarningMessage("No token passed, aborting");
        return;
      }

      await vscode.workspace
        .getConfiguration()
        .update("flyde.openAiToken", token, vscode.ConfigurationTarget.Global);

      vscode.window.showInformationMessage("OpenAI API Token set");
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("flyde.clearOpenAiToken", async () => {
      await vscode.workspace
        .getConfiguration()
        .update("flyde.openAiToken", "", vscode.ConfigurationTarget.Global);

      vscode.window.showInformationMessage("OpenAI API Token cleared");
    })
  );
}

// this method is called when your extension is deactivated
export function deactivate() {
  if (server) {
    server.close();
  }
  if (process) {
    process.kill();
  }
}
