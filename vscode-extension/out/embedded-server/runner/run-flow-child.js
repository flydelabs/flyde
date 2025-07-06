"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const run_flow_1 = require("./run-flow");
const typed_process_message_1 = require("./typed-process-message");
(0, typed_process_message_1.onMessage)(process, "runFlow", async (params) => {
    const { job, destroy, result } = await (0, run_flow_1.runFlow)(...params);
    (0, typed_process_message_1.sendMessage)(process, "runFlowResult", job);
    (0, typed_process_message_1.onMessage)(process, "destroyRunFlow", () => {
        destroy();
    });
    result.then((result) => {
        (0, typed_process_message_1.sendMessage)(process, "runFlowCompleted", result);
    }, (error) => {
        (0, typed_process_message_1.sendMessage)(process, "runFlowError", error);
    });
});
//# sourceMappingURL=run-flow-child.js.map