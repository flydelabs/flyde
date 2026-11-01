import * as path from "path";
import * as fs from "fs";
import * as os from "os";

import { runTests } from "@vscode/test-electron";

async function main() {
  try {
    // The folder containing the Extension Manifest package.json
    // Passed to `--extensionDevelopmentPath`
    const extensionDevelopmentPath = path.resolve(__dirname, "../../");

    // The path to test runner
    // Passed to --extensionTestsPath
    const extensionTestsPath = path.resolve(__dirname, "./suite/index");

    const proto: any = Object.prototype;

    if (!proto.toJSON) {
      proto.toJSON = function () {
        // Implementation of your toJSON method
        // Convert this object's properties to JSON as needed
        return JSON.stringify(this);
      };
    }

    const testRoot = fs.mkdtempSync(path.join(os.tmpdir(), "flyde-test-"));
    const workspace = path.join(testRoot, "workspace");
    fs.mkdirSync(workspace);

    // Download VS Code, unzip it and run the integration test
    await runTests({
      extensionDevelopmentPath,
      extensionTestsPath,
      version: '1.98.2',
      launchArgs: [workspace, `--user-data-dir=${path.join(testRoot, "profile")}`, "--disable-extensions", "--skip-welcome", "--skip-release-notes"],
      timeout: 60000,
    });
  } catch (err) {
    console.error("Failed to run tests");
    process.exit(1);
  }
}

main();
