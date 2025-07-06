"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.reportException = exports.reportEvent = exports.activateReporter = void 0;
const extension_telemetry_1 = require("@vscode/extension-telemetry");
const randomStrings = '5600aa930b08_1568_5f24_009f_ba24bbde';
let reporter;
const activateReporter = () => {
    reporter = new extension_telemetry_1.default(randomStrings.replace(/_/g, '-').split('').reverse().join(''));
    return reporter;
};
exports.activateReporter = activateReporter;
const checkReporter = () => {
    if (!reporter) {
        console.error('Reporter not activated');
    }
    return !!reporter;
};
const reportEvent = (...args) => {
    if (checkReporter()) {
        reporter.sendTelemetryEvent(...args);
    }
};
exports.reportEvent = reportEvent;
const reportException = (...args) => {
    if (checkReporter()) {
        reporter.sendTelemetryException(...args);
    }
};
exports.reportException = reportException;
//# sourceMappingURL=telemetry.js.map