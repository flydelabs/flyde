import * as path from "path";
import * as fs from "fs";
import * as os from "os";

import { runTests } from "@vscode/test-electron";

async function main() {
  // macOS Unix socket paths are limited to 103 characters. Keep the isolated
  // test profile outside the potentially long checkout path.
  const testProfile = fs.mkdtempSync(path.join(os.tmpdir(), "flyde-test-"));
  const userData = path.join(testProfile, "user-data");
  fs.mkdirSync(path.join(userData, "User"), { recursive: true });
  fs.writeFileSync(path.join(userData, "User/settings.json"), JSON.stringify({
    "flyde.telemetry.enabled": false,
    "telemetry.telemetryLevel": "off",
  }));
  const workspaceFile = path.join(testProfile, "tests.code-workspace");
  fs.writeFileSync(workspaceFile, JSON.stringify({
    folders: [{ path: path.resolve(__dirname, "../../test-fixtures") }],
  }));
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

    // Download VS Code, unzip it and run the integration test
    await runTests({
      extensionDevelopmentPath,
      extensionTestsPath,
      version: '1.98.2',
      launchArgs: [
        workspaceFile,
        "--user-data-dir", userData,
        "--disable-extensions", "--skip-welcome", "--skip-release-notes",
      ],
      timeout: 60000,
    });
  } catch (err) {
    console.error("Failed to run tests", err);
    process.exitCode = 1;
  } finally {
    fs.rmSync(testProfile, { recursive: true, force: true });
  }
}

main();
