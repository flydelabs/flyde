// You can import and use all API from the 'vscode' module
// as well as import your extension to test it
import * as vscode from "vscode";
import * as path from "path";
import * as fs from "fs";
import * as os from "os";

import { webviewTestingCommand } from "./testUtils";
import assert = require("assert");
import { delay, eventually } from "@flyde/core";
import { getTemplates } from "../templateUtils";

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
        const source = path.join(templatesDir, templateFolder, `Example.flyde`);
        const dest = path.join(tmpDir, `${templateFolder}.flyde`);
        fs.copyFileSync(source, dest);
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
    const testFile = vscode.Uri.file(path.resolve(tmpDir, "HelloWorld.flyde"));

    await vscode.commands.executeCommand(
      "vscode.openWith",
      testFile,
      "flydeEditor"
    );
    
    await eventually(async () => {
      const instances = await webviewTestingCommand("$$", {
        selector: ".ins-view",
      });
      assert(
        instances.length === 4,
        `Expected fixture flow to have 4 instances. Got ${instances.length} instances`
      );
    });


  }).retries(3);

  test("Renders add nodes menu", async () => {
    const testFile = vscode.Uri.file(
      path.resolve(__dirname, "../../test-fixtures/HelloWorld.flyde")
    );

    await vscode.commands.executeCommand(
      "vscode.openWith",
      testFile,
      "flydeEditor"
    );

    await eventually(async () => {
      const elements = await webviewTestingCommand("$$", {
        selector: "button.add-nodes",
      });

      assert(
        elements.length === 1,
        "Expected to find the add node button in the actions menu"
      );
    });

    await webviewTestingCommand("click", {
      selector: "button.add-nodes",
    });

    await eventually(async () => {
      const elements = await webviewTestingCommand("$$", {
        selector: "[cmdk-item]",
      });
      assert(
        elements.length > 30,
        `Expected to find 30+ items in the menu. Found ${elements.length} items`
      );
    });
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
        const flowPath = path.join(tmpDir, `${templateFolder}.flyde`);
        const testFile = vscode.Uri.file(flowPath);

        await vscode.commands.executeCommand(
          "vscode.openWith",
          testFile,
          "flydeEditor"
        );

        await eventually(async () => {
          const flowEditor = await webviewTestingCommand("$$", {
            selector: ".flyde-flow-editor",
          });

          assert(flowEditor.length === 1, ".flyde-flow-editor not found");
        }, 4000);
      })
        .timeout(6000)
        .retries(3);
    });
  });

  suite("Note node", () => {
    test("renders note node", async () => {
      const testFile = vscode.Uri.file(
        path.resolve(__dirname, "../../test-fixtures/NoteFixture.flyde")
      );

      await vscode.commands.executeCommand(
        "vscode.openWith",
        testFile,
        "flydeEditor"
      );

      await eventually(async () => {
        const instances = await webviewTestingCommand("$$", {
          selector: ".base-node-view-inner",
        });

        assert(
          instances.length === 1,
          "Expected fixture flow to have 1 instance"
        );

        assert(
          instances[0].innerHTML.includes("<h1>Hello comment</h1>"),
          `Expected the note node HTML to render the comment in html. ${instances[0].innerHTML}`
        );
      });
    }).timeout(5000);
  });
});
