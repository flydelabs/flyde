"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = activate;
exports.deactivate = deactivate;
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = require("vscode");
const flydeEditor_1 = require("./flydeEditor");
var fp = require("find-free-port");
const embedded_server_1 = require("./embedded-server");
const path_1 = require("path");
const telemetry_1 = require("./telemetry");
const templateUtils_1 = require("./templateUtils");
// the application insights key (also known as instrumentation key)
// telemetry reporter
let reporter;
// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
let server;
let process;
const FLYDE_DEFAULT_SERVER_PORT = 8545;
function activate(context) {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    const { Uri } = vscode;
    const { fs } = vscode.workspace;
    const firstWorkspace = vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders[0];
    const fileRoot = firstWorkspace ? firstWorkspace.uri.fsPath : "";
    // ensure it gets properly disposed. Upon disposal the events will be flushed
    context.subscriptions.push((0, telemetry_1.activateReporter)());
    (0, telemetry_1.reportEvent)("activate");
    const mainOutputChannel = vscode.window.createOutputChannel("Flyde");
    const debugOutputChannel = vscode.window.createOutputChannel("Flyde (Debug)");
    let currentTheme = vscode.window.activeColorTheme;
    let useDarkMode = currentTheme.kind !== vscode.ColorThemeKind.Light &&
        currentTheme.kind !== vscode.ColorThemeKind.HighContrastLight;
    vscode.window.onDidChangeActiveColorTheme((theme) => {
        useDarkMode =
            theme.kind !== vscode.ColorThemeKind.Light &&
                theme.kind !== vscode.ColorThemeKind.HighContrastLight;
    });
    fp(FLYDE_DEFAULT_SERVER_PORT).then(([port]) => {
        (0, telemetry_1.reportEvent)("devServerStart");
        const editorStaticsRoot = (0, path_1.join)(__dirname, "../webview-dist");
        const cleanServer = (0, embedded_server_1.createEmbeddedServer)({
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
        context.subscriptions.push(flydeEditor_1.FlydeEditorEditorProvider.register(context, {
            port,
            mainOutputChannel,
            debugOutputChannel,
            darkMode: useDarkMode,
        }));
    });
    const openAsTextHandler = async (uri) => {
        const document = await vscode.workspace.openTextDocument(uri);
        // Show the document in the text editor
        await vscode.window.showTextDocument(document);
        if (reporter) {
            reporter.sendTelemetryEvent("openAsText");
        }
    };
    context.subscriptions.push(vscode.commands.registerCommand("flyde.openAsText", openAsTextHandler));
    function getWorkspaceRootPath() {
        // Check if there is an open workspace
        if (vscode.workspace.workspaceFolders &&
            vscode.workspace.workspaceFolders.length > 0) {
            // Return the path of the first workspace folder
            return vscode.workspace.workspaceFolders[0].uri;
        }
    }
    context.subscriptions.push(vscode.commands.registerCommand("flyde.newVisualFlow", async (dirName) => {
        (0, telemetry_1.reportEvent)("newVisualFlow:start");
        let folderOrFileUri = dirName ?? getWorkspaceRootPath(); // folder will be undefined when triggered by keybinding
        if (!folderOrFileUri) {
            vscode.window.showErrorMessage("No folder or file selected");
            return;
        }
        const folderStat = await fs.stat(folderOrFileUri);
        const folderUri = folderStat.type === vscode.FileType.Directory
            ? folderOrFileUri
            : vscode.Uri.joinPath(folderOrFileUri, "..");
        const templates = (0, templateUtils_1.getTemplates)();
        const template = await vscode.window.showQuickPick(templates.map((t) => ({
            ...t,
            label: t.name,
            description: t.tags.join(", "),
            detail: t.description,
        })));
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
        if ((await fs.readFile(targetPath).then(() => true, () => false)) === true) {
            vscode.window.showErrorMessage(`File ${targetPath} already exists!`);
            return;
        }
        try {
            (0, telemetry_1.reportEvent)("newVisualFlow:before", { template: template.name });
            (0, templateUtils_1.scaffoldTemplate)(template, folderUri.fsPath, fileName);
            vscode.commands.executeCommand("vscode.openWith", targetPath, "flydeEditor");
            (0, telemetry_1.reportEvent)("newVisualFlow:success", { template: template.name });
            vscode.window.showInformationMessage(`New flow created at ${fileName}.flyde!`);
        }
        catch (error) {
            vscode.window.showErrorMessage(`Error creating flow: ${error}`);
        }
    }));
    context.subscriptions.push(vscode.commands.registerCommand("flyde.setOpenAiToken", async () => {
        const token = await vscode.window.showInputBox({
            title: "Please enter your OpenAI API key (will be stored in your settings for future use, you can also set it manually or clear it in the settings)",
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
    }));
    context.subscriptions.push(vscode.commands.registerCommand("flyde.clearOpenAiToken", async () => {
        await vscode.workspace
            .getConfiguration()
            .update("flyde.openAiToken", "", vscode.ConfigurationTarget.Global);
        vscode.window.showInformationMessage("OpenAI API Token cleared");
    }));
}
// this method is called when your extension is deactivated
function deactivate() {
    if (server) {
        server.close();
    }
    if (process) {
        process.kill();
    }
}
//# sourceMappingURL=extension.js.map