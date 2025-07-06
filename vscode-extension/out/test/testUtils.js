"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.webviewTestingCommand = webviewTestingCommand;
const core_1 = require("@flyde/core");
const flydeEditor_1 = require("../flydeEditor");
const assert = require("assert");
async function getLastWebview() {
    await (0, core_1.eventually)(() => assert(!!(0, flydeEditor_1.getLastWebviewForTests)()));
    return (0, flydeEditor_1.getLastWebviewForTests)();
}
async function webviewTestingCommand(command, params) {
    const webview = await getLastWebview();
    return new Promise((res, rej) => {
        webview.onDidReceiveMessage((message) => {
            if (message.type === "__webviewTestingResponse") {
                if (message.error) {
                    rej(message.error);
                }
                else {
                    res(message.response);
                }
            }
        });
        webview.postMessage({
            type: "__webviewTestingCommand",
            command,
            params,
        });
    });
}
//# sourceMappingURL=testUtils.js.map