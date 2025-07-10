// You can import and use all API from the 'vscode' module
// as well as import your extension to test it
import * as vscode from "vscode";
import * as path from "path";

import assert = require("assert");
import { delay, eventually } from "@flyde/core";
import { getTemplates } from "../templateUtils";
import {
  openFlydeFile,
  waitForFlowEditor,
  getInstances,
  clickAddNodesButton,
  getMenuItems,
  runFlow,
  getDebuggerEvents,
  buildTestFilePath,
  buildTempFilePath,
} from "./pageObjects";
import { createTempTestWorkspace } from "./testFileUtils";
import { webviewTestingCommand } from "./testUtils";

let tmpDir = "";

suite("Extension Test Suite", () => {
  suiteSetup(() => {
    // Copy all test-fixtures to a temp directory and set the workspace to that directory
    const fixturesDir = path.resolve(__dirname, "../../test-fixtures");
    const templatesDir = path.resolve(__dirname, "../../templates");

    tmpDir = createTempTestWorkspace(fixturesDir, templatesDir);
    console.log(`Temporary directory created at ${tmpDir}`);
  });

  // Close all editors after each test
  teardown(async () => {
    await vscode.commands.executeCommand("workbench.action.closeAllEditors");
  });

  test("Loads test flow and renders instance views", async () => {
    const testFile = buildTempFilePath(tmpDir, "HelloWorld.flyde");
    await openFlydeFile(testFile);
    await waitForFlowEditor();
    const instances = await getInstances();
    assert(instances.length === 4, `Expected 4 instances. Got ${instances.length}`);
  }).retries(3);

  test("Renders add nodes menu", async () => {
    const testFile = buildTestFilePath("HelloWorld.flyde");
    await openFlydeFile(testFile);
    await waitForFlowEditor();
    await clickAddNodesButton();
    const menuItems = await getMenuItems();
    assert(menuItems.length >= 30, `Expected at least 30 menu items. Found ${menuItems.length}`);
  }).retries(3);

  test("Test flow functionality works", async () => {
    const testFile = buildTestFilePath("HelloWorld.flyde");
    await openFlydeFile(testFile);
    await waitForFlowEditor();
    await runFlow();

    await eventually(async () => {
      const events = await getDebuggerEvents();
      const hasHelloWorldOutput = events.some(event =>
        JSON.stringify(event).includes("HelloWorld")
      );
      assert(hasHelloWorldOutput, "Expected debugger events to contain 'HelloWorld' output");
    }, 4000);
  }).retries(3);

  test("Loads custom nodes from .flyde-nodes.json override", async () => {
    // Open the flow file from the custom-nodes-override directory  
    const testFile = path.join(tmpDir, "custom-nodes-override", "CustomNodesFlow.flyde");
    await openFlydeFile(testFile);
    await waitForFlowEditor();

    // Initially, flow should only contain Bob
    const initialInstances = await getInstances();
    assert(initialInstances.length === 1, `Expected exactly 1 initial instance (Bob), but got ${initialInstances.length}`);
    const bobExists = initialInstances.some(instance =>
      instance.textContent?.includes("Custom Bob")
    );
    assert(bobExists, "Expected to find 'Custom Bob' instance in the initial flow");
    // Click add nodes button to open the menu
    await clickAddNodesButton();

    // Get all menu items
    const menuItems = await getMenuItems();
    // Check if all custom nodes appear in the menu
    const customBobExists = menuItems.some(item =>
      item.textContent?.includes("Custom Bob")
    );
    const customAliceExists = menuItems.some(item =>
      item.textContent?.includes("Custom Alice")
    );

    assert(customBobExists, "Expected 'Custom Bob' node to appear in the menu");
    assert(customAliceExists, "Expected 'Custom Alice' node to appear in the menu");

    // Click on Alice to add it to the canvas
    await webviewTestingCommand("clickByText", { text: "Custom Alice" });

    // Wait a moment for the node to be added
    await eventually(async () => {
      const instancesAfterAdd = await getInstances();
      assert(instancesAfterAdd.length === 2, `Expected 2 instances after adding Alice, but got ${instancesAfterAdd.length}`);
    }, 2000);

    // Verify Alice is now visible in the canvas
    const finalInstances = await getInstances();
    const aliceExists = finalInstances.some(instance =>
      instance.textContent?.includes("Custom Alice")
    );
    assert(aliceExists, "Expected to find 'Custom Alice' instance in the canvas after adding it");

  }).retries(3);


  suite("Templates", () => {
    const templateFiles = getTemplates();

    test("Loads all templates", async () => {
      assert(
        templateFiles.length > 0,
        "Expected to find at least one template"
      );
    }).retries(3);

    templateFiles.forEach((templateFile) => {
      test(`Loads ${templateFile.name} template`, async () => {
        const templateFolder = templateFile.fullPath.split(path.sep).pop();
        const flowPath = buildTempFilePath(tmpDir, `${templateFolder}.flyde`);
        await openFlydeFile(flowPath);
        await waitForFlowEditor();
      })
        .timeout(10000)
        .retries(3);
    });
  });

  suite("Note node", () => {
    test("renders note node", async () => {
      const testFile = buildTestFilePath("NoteFixture.flyde");
      await openFlydeFile(testFile);
      await waitForFlowEditor();
      const instances = await getInstances();
      assert(instances.length === 1, "Expected 1 note node");
      assert(
        instances[0].innerHTML.includes("Hello comment") && instances[0].innerHTML.includes("<h1"),
        `Expected note node to contain "Hello comment" with h1 tag. Got: ${instances[0].innerHTML}`
      );
    }).timeout(5000);
  });
});
