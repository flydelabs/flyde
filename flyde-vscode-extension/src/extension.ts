// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';

import { FlydeEditorEditorProvider } from './flydeEditor';
import * as execa from 'execa';
import { join } from 'path/posix';
var fp = require("find-free-port");


import { initFlydeDevServer} from '@flyde/dev-server/dist/lib';

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed

let server: any;

let process: execa.ExecaChildProcess;

const FLYDE_DEFAULT_SERVER_PORT = 4242;

export function activate(context: vscode.ExtensionContext) {

	const firstWorkspace = vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders[0];
	    const fileRoot = firstWorkspace ? firstWorkspace.uri.fsPath : '';


	fp(FLYDE_DEFAULT_SERVER_PORT).then(([port]: [number])  => {
		console.log(`Starting Flyde server on port ${port}`);

		const file = join(__dirname, '../../dev-server/dist/cli.js');

		// initFlydeDevServer({port, root: fileRoot});
		// console.log({file});

		process = execa.execaCommand(`node ${file} --port ${port} --root ${fileRoot}`, {stdio: 'inherit'});
	
		context.subscriptions.push(FlydeEditorEditorProvider.register(context, port));
		// runDevServer(port, fileRoot);
	});
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
