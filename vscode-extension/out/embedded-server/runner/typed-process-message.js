"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendMessage = sendMessage;
exports.onMessage = onMessage;
function sendMessage(process, type, data) {
    process.send?.({ type, data });
}
function onMessage(process, type, callback) {
    function handler(message) {
        if (message.type === type) {
            callback(message.data);
            process.removeListener("message", handler);
        }
    }
    process.on("message", handler);
}
//# sourceMappingURL=typed-process-message.js.map