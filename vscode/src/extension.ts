// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";

import { FlydeEditorEditorProvider } from "./flydeEditor";
import * as execa from "execa";

var fp = require("find-free-port");

import { createEmbeddedServer } from "./embedded-server";

import { join } from "path";

import { activateReporter, reportEvent, analytics } from "./analytics";
import { showFirstRunPrivacyNotice, showPrivacySettings } from "./privacyNotice";

import { Template, getTemplates, scaffoldTemplate } from "./templateUtils";

// the application insights key (also known as instrumentation key)


// this method is called when your extension is activated
// your extension is activated the very first time the command is executed

let server: any;

let process: execa.ExecaChildProcess | undefined;

const FLYDE_DEFAULT_SERVER_PORT = 8545;

export function activate(context: vscode.ExtensionContext) {
  // eslint-disable-next-line @typescript-eslint/naming-convention
  const { Uri } = vscode;
  const { fs } = vscode.workspace;

  const firstWorkspace =
    vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders[0];
  const fileRoot = firstWorkspace ? firstWorkspace.uri.fsPath : "";

  // Initialize analytics with context
  analytics.setContext(context);

  // Show first-run privacy notice and initialize analytics
  showFirstRunPrivacyNotice(context).then(() => {
    activateReporter();
    reportEvent("activate");
  });

  context.subscriptions.push({
    dispose() {
      analytics.dispose();
    }
  });

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

    const editorStaticsRoot = join(__dirname, "../webview-dist");
    const cleanServer = createEmbeddedServer({
      port,
      editorStaticsRoot,
    }, (events) => {
      events.forEach((event) => {
        debugOutputChannel.appendLine(JSON.stringify(event));
      });
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
          scaffoldTemplate(template, folderUri.fsPath, fileName);
          vscode.commands.executeCommand(
            "vscode.openWith",
            targetPath,
            "flydeEditor"
          );
          reportEvent("newVisualFlow", { template: template.name });
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
        title:
          "Please enter your OpenAI API key (will be stored in your settings for future use, you can also set it manually or clear it in the settings)",
        value: "",
        ignoreFocusOut: true,
        password: true,
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

  context.subscriptions.push(
    vscode.commands.registerCommand("flyde.showPrivacySettings", async () => {
      await showPrivacySettings();
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
