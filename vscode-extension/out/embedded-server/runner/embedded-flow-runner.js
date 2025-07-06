"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmbeddedFlowRunner = void 0;
const child_process_1 = require("child_process");
const path_1 = require("path");
const typed_process_message_1 = require("./typed-process-message");
class EmbeddedFlowRunner {
    constructor(debuggerPort) {
        this.debuggerPort = debuggerPort;
    }
    forkRunFlow(data) {
        return new Promise((resolve, reject) => {
            const file = (0, path_1.join)(__dirname, "run-flow-child.js");
            const runFlowProcess = (0, child_process_1.fork)(file, {
                stdio: ["pipe", "pipe", "pipe", "ipc"],
                cwd: data.cwd,
            });
            runFlowProcess.stdout?.on("data", (data) => {
                console.log(`stdout: ${data}`);
            });
            runFlowProcess.stderr?.on("data", (data) => {
                if (data.includes("Starting inspector")) {
                    return; // Ignore VS Code debugger messages
                }
                console.error(`stderr: ${data}`);
                reject(new Error(data));
            });
            runFlowProcess.on("close", (code) => {
                if (code !== 0) {
                    reject(new Error(`runFlow process exited with code ${code}`));
                }
            });
            const resultsPromise = new Promise((resolve, reject) => {
                (0, typed_process_message_1.onMessage)(runFlowProcess, "runFlowCompleted", (result) => {
                    resolve(result);
                    // Allow time for debugger events
                    setTimeout(() => {
                        runFlowProcess.kill();
                    }, 200);
                });
                (0, typed_process_message_1.onMessage)(runFlowProcess, "runFlowError", (error) => {
                    reject(error);
                    setTimeout(() => {
                        runFlowProcess.kill();
                    }, 200);
                });
            });
            (0, typed_process_message_1.onMessage)(runFlowProcess, "runFlowResult", (job) => {
                resolve({
                    job,
                    destroy: () => runFlowProcess.kill(),
                    result: resultsPromise,
                });
            });
            (0, typed_process_message_1.sendMessage)(runFlowProcess, "runFlow", data.runFlowParams);
        });
    }
}
exports.EmbeddedFlowRunner = EmbeddedFlowRunner;
//# sourceMappingURL=embedded-flow-runner.js.map