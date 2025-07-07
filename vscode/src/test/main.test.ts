// You can import and use all API from the 'vscode' module
// as well as import your extension to test it
import * as vscode from "vscode";
import * as path from "path";
import * as fs from "fs";
import * as os from "os";

import assert = require("assert");
import { getTemplates } from "../templateUtils";
import {
  openFlydeFile,
  waitForFlowEditor,
  getInstances,
  clickAddNodesButton,
  getMenuItems,
  buildTestFilePath,
  buildTempFilePath,
} from "./pageObjects";

let tmpDir = "";

suite("Extension Test Suite", () => {
  suiteSetup(() => {
    // copy all test-fixtures to a temp directory
    // and set the workspace to that directory
    tmpDir = path.join(os.tmpdir(), `flyde-test-fixtures-${Date.now()}`);

    if (!fs.existsSync(tmpDir)) {
      fs.mkdirSync(tmpDir, { recursive: true });

      const fixturesDir = path.resolve(__dirname, "../../test-fixtures");

      fs.readdirSync(fixturesDir).forEach((file) => {
        const source = path.join(fixturesDir, file);
        const dest = path.join(tmpDir, file);
        fs.copyFileSync(source, dest);
      });

      const templatesDir = path.resolve(__dirname, "../../templates");
      fs.readdirSync(templatesDir).forEach((templateFolder) => {
        // Skip hidden files like .DS_Store
        if (templateFolder.startsWith('.')) {
          return;
        }

        const source = path.join(templatesDir, templateFolder, `Example.flyde`);
        const dest = path.join(tmpDir, `${templateFolder}.flyde`);
        if (fs.existsSync(source)) {
          fs.copyFileSync(source, dest);
        }
      });
      console.log(`Temporary directory created at ${tmpDir}`);
    } else {
      throw new Error("Temporary directory already exists");
    }
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
