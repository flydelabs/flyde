"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.maybeAskToStarProject = maybeAskToStarProject;
const vscode = require("vscode");
const telemetry_1 = require("./telemetry");
let askedThisSession = false;
// checks if the user hasn't seen this message before, and if so, asks them to star the project
function maybeAskToStarProject(delay) {
    if (askedThisSession || getAskedToStarProject()) {
        return;
    }
    askedThisSession = true;
    setTimeout(async () => {
        (0, telemetry_1.reportEvent)("askedToStarProject");
        const answer = await vscode.window.showInformationMessage("If you like Flyde, please star the project on GitHub!", "Sure, I'll star it! 🌟", "No, maybe later", "Don't ask again");
        switch (answer) {
            case "Don't ask again":
                (0, telemetry_1.reportEvent)("askedToStarProject:doNotAskAgain");
                setAskedToStarProject(true);
                break;
            case "No, maybe later":
                (0, telemetry_1.reportEvent)("askedToStarProject:maybeLater");
                break;
            case "Sure, I'll star it! 🌟":
                (0, telemetry_1.reportEvent)("askedToStarProject:star");
                vscode.env.openExternal(vscode.Uri.parse("https://www.github.com/FlydeHQ/flyde?ref=vscode-toast"));
                vscode.window.showInformationMessage("Thanks for your support! 🙏");
                setAskedToStarProject(true);
                break;
        }
    }, delay);
}
function getAskedToStarProject() {
    return vscode.workspace
        .getConfiguration()
        .get("flyde.askedToStarProject", vscode.ConfigurationTarget.Global);
}
function setAskedToStarProject(value) {
    return vscode.workspace
        .getConfiguration()
        .update("flyde.askedToStarProject", value, vscode.ConfigurationTarget.Global);
}
//# sourceMappingURL=maybeAskToStarProject.js.map