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
  addNodeFromMenu,
  waitForInstanceCount,
  findMenuItemByText,
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

  test("Adds nodes from menu to canvas", async () => {
    const testFile = buildTestFilePath("HelloWorld.flyde");
    await openFlydeFile(testFile);
    await waitForFlowEditor();

    const initialInstances = await getInstances();
    const initialCount = initialInstances.length;

    await addNodeFromMenu("Value");
    await waitForInstanceCount(initialCount + 1);

    const finalInstances = await getInstances();
    const valueExists = finalInstances.some(instance =>
      instance.textContent?.includes("Value")
    );
    assert(valueExists, "Expected to find added 'Value' node in canvas");
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

  test("Loads custom nodes from flyde-nodes.json override", async () => {
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

    // Check if @flyde/nodes shorthand nodes appear in the menu with proper display names
    const getAttributeExists = menuItems.some(item =>
      item.textContent?.includes("Get Property")
    );
    const httpMenuExists = menuItems.some(item =>
      item.textContent?.includes("HTTP Request")
    );

    assert(getAttributeExists, "Expected 'Get Property' node (GetAttribute from @flyde/nodes) to appear in the menu");
    assert(httpMenuExists, "Expected 'HTTP Request' node (Http from @flyde/nodes) to appear in the menu");

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

    // Test adding @flyde/nodes shorthand nodes to the canvas
    // First, add GetAttribute node
    await clickAddNodesButton();
    await webviewTestingCommand("clickByText", { text: "Get Property" });

    // Wait for the node to be added
    await eventually(async () => {
      const instancesWithGetAttr = await getInstances();
      assert(instancesWithGetAttr.length === 3, `Expected 3 instances after adding GetAttribute, but got ${instancesWithGetAttr.length}`);
    }, 2000);

    // Verify GetAttribute shows proper display name - check that it's not just showing the ID
    const instancesWithGetAttr = await getInstances();
    const getAttrExists = instancesWithGetAttr.some(instance => {
      const text = instance.textContent || "";
      // Should contain "Get" and not be just "GetAttribute" (proving it resolved from @flyde/nodes)
      return text.includes("Get") && !text.trim().endsWith("GetAttribute");
    });
    assert(getAttrExists, "Expected to find GetAttribute instance with resolved display name (not just 'GetAttribute' ID) in the canvas");

    // Add HTTP node  
    await clickAddNodesButton();
    await webviewTestingCommand("clickByText", { text: "HTTP Request" });

    // Wait for the node to be added
    await eventually(async () => {
      const instancesWithHttp = await getInstances();
      assert(instancesWithHttp.length === 4, `Expected 4 instances after adding HTTP, but got ${instancesWithHttp.length}`);
    }, 2000);

    // Verify HTTP shows proper display name - check that it's not just showing the ID
    const instancesWithHttp = await getInstances();
    const httpExists = instancesWithHttp.some(instance => {
      const text = instance.textContent || "";
      // Should contain "HTTP" and not be just "Http" (proving it resolved from @flyde/nodes)
      return text.includes("HTTP") && !text.trim().endsWith("Http");
    });

    // Debug: log all instance text to see what we actually got
    if (!httpExists) {
      const allTexts = instancesWithHttp.map(i => i.textContent || "").filter(t => t.trim());
      console.log("All instance texts:", allTexts);
    }

    assert(httpExists, "Expected to find HTTP instance with resolved display name (not just 'Http' ID) in the canvas");

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

  suite("Nested Flows", () => {
    test("handles adding nested flows and properly loads flows after adding them", async () => {
      const testFile = path.join(tmpDir, "nested-flows", "ParentFlow.flyde");
      await openFlydeFile(testFile);
      await waitForFlowEditor();

      // Should load parent flow with existing nested child flow
      const initialInstances = await getInstances();
      assert(initialInstances.length === 1, `Expected 1 initial instance. Got ${initialInstances.length}`);

      // Add another ChildFlow from menu using new utilities
      await addNodeFromMenu("ChildFlow");
      await waitForInstanceCount(2);

      // Verify we now have 2 instances
      const instancesAfterAdd = await getInstances();
      assert(instancesAfterAdd.length === 2, `Expected 2 instances after adding nested flow. Got ${instancesAfterAdd.length}`);

      await delay(3000);

      // Save the file to trigger the path resolution bug
      await vscode.commands.executeCommand("workbench.action.files.save");
      await delay(1000);

      // Close and reopen to test for path duplication/corruption 
      await vscode.commands.executeCommand("workbench.action.closeActiveEditor");
      await delay(500);
      await openFlydeFile(testFile);
      await waitForFlowEditor();


      await waitForInstanceCount(2);
      const reloadedInstances = await getInstances();
      // Both should be ChildFlow instances
      const childFlowCount = reloadedInstances.filter(instance =>
        instance.textContent?.includes("ChildFlow")
      ).length;

      assert(childFlowCount === 2, `Expected 2 ChildFlow instances after reload, but got ${childFlowCount}. This suggests the fix for absolute paths didn't work correctly.`);

    }).retries(3);
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
