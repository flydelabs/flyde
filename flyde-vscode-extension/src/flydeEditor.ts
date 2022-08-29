import path = require('path');
import * as vscode from 'vscode';
import { getWebviewContent } from './open-flyde-panel';
var fp = require("find-free-port");

const FLYDE_DEFAULT_SERVER_PORT = 8545;


export class FlydeEditorEditorProvider implements vscode.CustomTextEditorProvider {

	port: number = FLYDE_DEFAULT_SERVER_PORT;

	setPort (port: number) {
		this.port = port;
	};

	public static register(context: vscode.ExtensionContext, port: number): vscode.Disposable {
		const provider = new FlydeEditorEditorProvider(context);

		provider.setPort(port);


        const firstWorkspace = vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders[0];
	    const fileRoot = firstWorkspace ? firstWorkspace.uri.fsPath : '';

		const providerRegistration = vscode.window.registerCustomEditorProvider(FlydeEditorEditorProvider.viewType, provider);

		return providerRegistration;
	}

	private static readonly viewType = 'flydeEditor';

	constructor(
		private readonly context: vscode.ExtensionContext
	) { }

	/**
	 * Called when our custom editor is opened.
	 * 
	 * 
	 */
	public async resolveCustomTextEditor(
		document: vscode.TextDocument,
		webviewPanel: vscode.WebviewPanel,
		_token: vscode.CancellationToken
	): Promise<void> {
		// Setup initial content for the webview
		webviewPanel.webview.options = {
			enableScripts: true
		};

        const firstWorkspace = vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders[0];
	    const fileRoot = firstWorkspace ? firstWorkspace.uri.fsPath : '';

        const relative = path.relative(fileRoot, document.fileName);
		webviewPanel.webview.html = getWebviewContent(this.context.extensionUri, relative, this.port, webviewPanel.webview);
        
		function updateWebview() {
			webviewPanel.webview.postMessage({
				type: 'update',
				text: document.getText(),
			});
		}

		// Hook up event handlers so that we can synchronize the webview with the text document.
		//
		// The text document acts as our model, so we have to sync change in the document to our
		// editor and sync changes in the editor back to the document.
		// 
		// Remember that a single text document can also be shared between multiple custom
		// editors (this happens for example when you split a custom editor)

		const changeDocumentSubscription = vscode.workspace.onDidChangeTextDocument(e => {
			if (e.document.uri.toString() === document.uri.toString()) {
				updateWebview();
			}
		});

		// Make sure we get rid of the listener when our editor is closed.
		webviewPanel.onDidDispose(() => {
			changeDocumentSubscription.dispose();
		});

	}

	/**
	 * Get the static html used for the editor webviews.
	 */
}