import * as vscode from 'vscode';
import { FlydeEditorProvider } from './flydeEditor';
import { FileWatcherService } from './fileWatcherService'; // Import the new service

export function activate(context: vscode.ExtensionContext) {
	console.log('Congratulations, your extension "flyde" is now active!');

	// Register the custom editor provider
	context.subscriptions.push(FlydeEditorProvider.register(context));

	// Initialize and register the FileWatcherService
	const fileWatcherService = new FileWatcherService();
	context.subscriptions.push(fileWatcherService); // Add to subscriptions for disposal
}

export function deactivate() {}
