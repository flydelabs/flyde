"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.runFlow = runFlow;
const cuid2_1 = require("@paralleldrive/cuid2");
const loader_1 = require("@flyde/loader");
async function runFlow(flow, flowPath, inputs = {}, port, executionDelay, secrets = {}) {
    const id = (0, cuid2_1.createId)();
    const execute = (0, loader_1.loadFlowFromContent)(flow, flowPath, `http://localhost:${port}`, secrets);
    const data = execute(inputs, { executionDelay });
    const job = {
        id,
        flow,
    };
    return { job, result: data.result, destroy: data.destroy };
}
//# sourceMappingURL=run-flow.js.map