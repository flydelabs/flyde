"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const path = require("path");
const test_electron_1 = require("@vscode/test-electron");
async function main() {
    try {
        // The folder containing the Extension Manifest package.json
        // Passed to `--extensionDevelopmentPath`
        const extensionDevelopmentPath = path.resolve(__dirname, "../../");
        // The path to test runner
        // Passed to --extensionTestsPath
        const extensionTestsPath = path.resolve(__dirname, "./suite/index");
        const proto = Object.prototype;
        if (!proto.toJSON) {
            proto.toJSON = function () {
                // Implementation of your toJSON method
                // Convert this object's properties to JSON as needed
                return JSON.stringify(this);
            };
        }
        // Download VS Code, unzip it and run the integration test
        await (0, test_electron_1.runTests)({
            extensionDevelopmentPath,
            extensionTestsPath,
            version: '1.98.2',
            launchArgs: ["--disable-extensions"],
            timeout: 60000,
        });
    }
    catch (err) {
        console.error("Failed to run tests");
        process.exit(1);
    }
}
main();
//# sourceMappingURL=runTest.js.map