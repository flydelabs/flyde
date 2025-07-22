import * as vscode from "vscode";
import * as path from "path";
import { eventually } from "@flyde/core";
import { webviewTestingCommand } from "./testUtils";
import assert = require("assert");

// File operations
export async function openFlydeFile(filePath: string) {
  const testFile = vscode.Uri.file(filePath);
  await vscode.commands.executeCommand("vscode.openWith", testFile, "flydeEditor");
}

export function buildTestFilePath(relativePath: string, baseDir?: string): string {
  const base = baseDir || path.resolve(__dirname, "../../test-fixtures");
  return path.resolve(base, relativePath);
}

export function buildTempFilePath(tmpDir: string, fileName: string): string {
  return path.resolve(tmpDir, fileName);
}

// Base flow editor operations
export async function waitForFlowEditor(timeout = 4000) {
  await eventually(async () => {
    const flowEditor = await webviewTestingCommand("$$", { selector: ".flyde-flow-editor" });
    assert(flowEditor.length === 1, ".flyde-flow-editor not found");
  }, timeout);
}

export async function getInstances() {
  const elements = await webviewTestingCommand("$$", { selector: ".ins-view" });
  return elements.map(el => ({
    innerHTML: el.innerHTML,
    textContent: el.textContent
  }));
}

// UI interactions
export async function clickAddNodesButton() {
  await webviewTestingCommand("click", { selector: "button.add-nodes" });
}

export async function getMenuItems() {
  return await webviewTestingCommand("$$", { selector: "[cmdk-item]" });
}


export async function runFlow() {
  await webviewTestingCommand("click", { selector: "button.run-btn" });

  await eventually(async () => {
    const dialogs = await webviewTestingCommand("$$", { selector: "[role=dialog]" });
    assert(dialogs.length === 1, "Test dialog not found");
  });

  await webviewTestingCommand("clickByText", { text: "Run", tagName: "button" });
}

export async function getDebuggerEvents() {
  return await webviewTestingCommand("getDebuggerEvents", {});
}

// Menu utilities
export async function findMenuItemByText(text: string) {
  const menuItems = await getMenuItems();
  return menuItems.find(item => 
    item.textContent?.includes(text)
  );
}

export async function addNodeFromMenu(nodeText: string) {
  await clickAddNodesButton();
  
  const menuItem = await findMenuItemByText(nodeText);
  if (!menuItem) {
    const allMenuItems = await getMenuItems();
    const allTexts = allMenuItems.map(item => item.textContent);
    throw new Error(`Node "${nodeText}" not found in menu. Available: ${allTexts.join(', ')}`);
  }
  
  await webviewTestingCommand("clickByText", { text: nodeText });
}

export async function waitForInstanceCount(expectedCount: number, timeout = 2000) {
  await eventually(async () => {
    const instances = await getInstances();
    assert(instances.length === expectedCount, 
      `Expected ${expectedCount} instances, but got ${instances.length}`);
  }, timeout);
}