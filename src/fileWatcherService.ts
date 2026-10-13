import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs/promises';

/**
 * Represents the structure of a Flyde flow file, specifically focusing on imports.
 */
interface FlydeFlow {
    nodes: Array<{
        id: string;
        type: string;
        inputs?: any;
        outputs?: any;
        params?: any;
        // Other properties might exist, but we only care about 'path' for imports
        path?: string; // For 'import' type nodes
    }>;
    // Other properties of a Flyde flow file
}

export class FileWatcherService implements vscode.Disposable {
    private disposable: vscode.Disposable;

    constructor() {
        this.disposable = vscode.workspace.onDidRenameFiles(this.handleFileRename, this);
        console.log('Flyde FileWatcherService initialized.');
    }

    /**
     * Handles file rename/move events in the workspace.
     * @param event The rename event containing old and new URIs.
     */
    private async handleFileRename(event: vscode.FileRenameEvent) {
        console.log('File rename event detected.');

        for (const file of event.files) {
            const oldUri = file.oldUri;
            const newUri = file.newUri;

            // We only care about .flyde files being moved
            if (oldUri.fsPath.endsWith('.flyde') && newUri.fsPath.endsWith('.flyde')) {
                console.log(`Flyde file moved: ${oldUri.fsPath} -> ${newUri.fsPath}`);
                await this.updateImportsInWorkspace(oldUri, newUri);
            }
        }
    }

    /**
     * Updates import paths in all relevant .flyde files in the workspace
     * when a .flyde file is moved.
     * @param movedFileOldUri The old URI of the moved .flyde file.
     * @param movedFileNewUri The new URI of the moved .flyde file.
     */
    private async updateImportsInWorkspace(movedFileOldUri: vscode.Uri, movedFileNewUri: vscode.Uri) {
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders || workspaceFolders.length === 0) {
            console.log('No workspace folders open.');
            return;
        }

        // Find all .flyde files in the workspace
        const flydeFiles = await vscode.workspace.findFiles('**/*.flyde', '**/node_modules/**');

        for (const importingFileUri of flydeFiles) {
            // Skip the moved file itself
            if (importingFileUri.fsPath === movedFileNewUri.fsPath) {
                continue;
            }

            try {
                const content = await fs.readFile(importingFileUri.fsPath, 'utf8');
                const flow: FlydeFlow = JSON.parse(content);
                let changed = false;

                for (const node of flow.nodes) {
                    // Check if it's an 'import' type node and has a 'path' property
                    if (node.type === 'import' && node.path) {
                        const currentImportPath = node.path;
                        const importingFileDir = path.dirname(importingFileUri.fsPath);

                        // Resolve the absolute path of the currently imported file
                        const importedFileAbsolutePath = path.resolve(importingFileDir, currentImportPath);

                        // Check if this import path points to the file that was just moved
                        if (importedFileAbsolutePath === movedFileOldUri.fsPath) {
                            // Calculate the new relative path from the importing file to the moved file's new location
                            const newRelativePath = path.relative(importingFileDir, movedFileNewUri.fsPath);

                            // Ensure the path starts with ./ or ../ if it's a relative path
                            const formattedNewRelativePath = this.formatRelativePath(newRelativePath);

                            if (node.path !== formattedNewRelativePath) {
                                node.path = formattedNewRelativePath;
                                changed = true;
                                console.log(`Updated import in ${importingFileUri.fsPath}: ${currentImportPath} -> ${formattedNewRelativePath}`);
                            }
                        }
                    }
                }

                if (changed) {
                    // Write the updated content back to the file
                    await fs.writeFile(importingFileUri.fsPath, JSON.stringify(flow, null, 2), 'utf8');
                    vscode.window.showInformationMessage(`Flyde: Updated import path in ${path.basename(importingFileUri.fsPath)}.`);
                }
            } catch (error: any) {
                console.error(`Error processing file ${importingFileUri.fsPath}: ${error.message}`);
                // vscode.window.showErrorMessage(`Flyde: Error updating imports in ${path.basename(importingFileUri.fsPath)}: ${error.message}`);
            }
        }
    }

    /**
     * Formats a relative path to ensure it starts with './' or '../' if necessary.
     * @param relativePath The calculated relative path.
     * @returns The formatted relative path.
     */
    private formatRelativePath(relativePath: string): string {
        if (relativePath.startsWith('..')) {
            return relativePath;
        }
        if (relativePath.startsWith('.' + path.sep)) { // e.g., './folder/file.flyde'
            return relativePath;
        }
        return `.${path.sep}${relativePath}`; // e.g., 'folder/file.flyde' -> './folder/file.flyde'
    }

    /**
     * Disposes of the file watcher.
     */
    public dispose() {
        this.disposable.dispose();
        console.log('Flyde FileWatcherService disposed.');
    }
}
