import * as vscode from "vscode";
import { reportEvent } from "./analytics";

let askedThisSession = false;

// checks if the user hasn't seen this message before, and if so, asks them to star the project
export function maybeAskToStarProject(delay: number) {
  if (askedThisSession || getAskedToStarProject()) {
    return;
  }

  askedThisSession = true;

  setTimeout(async () => {
    reportEvent("askedToStarProject");
    const answer = await vscode.window.showInformationMessage(
      "If you like Flyde, please star the project on GitHub!",
      "Sure, I'll star it! 🌟",
      "No, maybe later",
      "Don't ask again"
    );
    switch (answer) {
      case "Don't ask again":
        reportEvent("askedToStarProject:doNotAskAgain");
        setAskedToStarProject(true);
        break;
      case "No, maybe later":
        reportEvent("askedToStarProject:maybeLater");
        break;
      case "Sure, I'll star it! 🌟":
        reportEvent("askedToStarProject:star");
        vscode.env.openExternal(
          vscode.Uri.parse(
            "https://www.github.com/FlydeHQ/flyde?ref=vscode-toast"
          )
        );
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

function setAskedToStarProject(value: boolean) {
  return vscode.workspace
    .getConfiguration()
    .update(
      "flyde.askedToStarProject",
      value,
      vscode.ConfigurationTarget.Global
    );
}
