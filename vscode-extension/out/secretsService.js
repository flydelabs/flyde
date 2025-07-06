"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSecrets = exports.addNewSecret = exports.getAvailableSecrets = void 0;
const vscode = require("vscode");
const path = require("path");
/**
 * Checks if a file exists
 */
const fileExists = async (filePath) => {
    try {
        await vscode.workspace.fs.stat(vscode.Uri.file(filePath));
        return true;
    }
    catch {
        return false;
    }
};
/**
 * Get the workspace root directory or the directory of the active file
 */
const getWorkspaceRoot = (filePath) => {
    return (vscode.workspace.workspaceFolders?.[0].uri.fsPath
        || (filePath ? path.dirname(filePath) : ""));
};
/**
 * Get all available secret keys from .env file
 */
const getAvailableSecrets = async (filePath) => {
    try {
        const workspaceRoot = getWorkspaceRoot(filePath);
        const envFilePath = path.join(workspaceRoot, '.env');
        if (await fileExists(envFilePath)) {
            const envContent = await vscode.workspace.fs.readFile(vscode.Uri.file(envFilePath));
            const envText = Buffer.from(envContent).toString('utf8');
            // Parse .env file to extract keys
            return envText.split('\n')
                .filter(line => line.trim() && !line.startsWith('#'))
                .map(line => line.split('=')[0].trim());
        }
        return [];
    }
    catch (error) {
        console.error("Error getting available secrets:", error);
        return [];
    }
};
exports.getAvailableSecrets = getAvailableSecrets;
/**
 * Add or update a secret in the .env file
 */
const addNewSecret = async (key, value, filePath) => {
    try {
        if (!key || !value) {
            throw new Error("Key and value are required");
        }
        const workspaceRoot = getWorkspaceRoot(filePath);
        const envFilePath = path.join(workspaceRoot, '.env');
        let envContent = '';
        let existingSecrets = [];
        // Read existing .env file if it exists
        if (await fileExists(envFilePath)) {
            const existingEnvContent = await vscode.workspace.fs.readFile(vscode.Uri.file(envFilePath));
            envContent = Buffer.from(existingEnvContent).toString('utf8');
            // Parse existing secrets
            existingSecrets = envContent.split('\n')
                .filter(line => line.trim() && !line.startsWith('#'))
                .map(line => line.split('=')[0].trim());
        }
        if (existingSecrets.includes(key)) {
            const envLines = envContent.split('\n');
            const updatedEnvLines = envLines.map(line => {
                if (line.startsWith(`${key}=`)) {
                    return `${key}=${value}`;
                }
                return line;
            });
            envContent = updatedEnvLines.join('\n');
        }
        else {
            envContent = envContent.trim();
            envContent += envContent ? '\n' : '';
            envContent += `${key}=${value}\n`;
            existingSecrets.push(key);
        }
        await vscode.workspace.fs.writeFile(vscode.Uri.file(envFilePath), Buffer.from(envContent, 'utf8'));
        vscode.window.showInformationMessage(`Secret "${key}" was successfully added to .env file`);
        return existingSecrets;
    }
    catch (error) {
        console.error("Error adding new secret:", error);
        throw error;
    }
};
exports.addNewSecret = addNewSecret;
/**
 * Get all secrets as key-value pairs from the .env file
 */
const getSecrets = async (filePath) => {
    try {
        const workspaceRoot = getWorkspaceRoot(filePath);
        const envFilePath = path.join(workspaceRoot, '.env');
        const secrets = {};
        if (await fileExists(envFilePath)) {
            const envContent = await vscode.workspace.fs.readFile(vscode.Uri.file(envFilePath));
            const envText = Buffer.from(envContent).toString('utf8');
            // Parse .env file to extract key-value pairs
            envText.split('\n')
                .filter(line => line.trim() && !line.startsWith('#'))
                .forEach(line => {
                const firstEqualIndex = line.indexOf('=');
                if (firstEqualIndex > 0) {
                    const key = line.substring(0, firstEqualIndex).trim();
                    const value = line.substring(firstEqualIndex + 1).trim();
                    secrets[key] = value;
                }
            });
        }
        return secrets;
    }
    catch (error) {
        console.error("Error getting secrets:", error);
        return {};
    }
};
exports.getSecrets = getSecrets;
//# sourceMappingURL=secretsService.js.map