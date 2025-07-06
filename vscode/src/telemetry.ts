import TelemetryReporter from "@vscode/extension-telemetry";

const randomStrings = '5600aa930b08_1568_5f24_009f_ba24bbde';
let reporter: TelemetryReporter;

export const activateReporter = () => {
    reporter = new TelemetryReporter(randomStrings.replace(/_/g, '-').split('').reverse().join(''));
    return reporter;
}

const checkReporter = () => {
    if (!reporter) {
        console.error('Reporter not activated');
    }
    return !!reporter;
};

export const reportEvent: typeof reporter['sendTelemetryEvent'] = (...args) => {
    if (checkReporter()) {
        reporter.sendTelemetryEvent(...args);
    }
};

export const reportException: typeof reporter['sendTelemetryException'] = (...args) => {
    if (checkReporter()) {
        reporter.sendTelemetryException(...args);
    }
}