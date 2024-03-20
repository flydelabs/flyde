import { FlydeFlow, ResolvedFlydeFlowDefinition } from "@flyde/core";
import * as vscode from "vscode";

export type WebviewContentParams = {
  extensionUri: vscode.Uri;
  relativeFile: string;
  executionId: string;
  port: number;
  webview: vscode.Webview;
  initialFlow: FlydeFlow;
  dependencies: ResolvedFlydeFlowDefinition;
  webviewId: string;
  darkMode: boolean;
};

const isDev = process.env.MODE === "dev";

const { fs } = vscode.workspace;

const getScriptTagsFromReactAppHtml = async (
  root: vscode.Uri,
  webview: vscode.Webview,
  isDev: boolean
) => {
  if (isDev) {
    return '<script defer="defer" src="http://localhost:3000/static/js/bundle.js"></script>';
  } else {
    // this assumes react scripts will always remain on the same structure
    const html = (
      await fs.readFile(vscode.Uri.joinPath(root, "editor-build/index.html"))
    ).toString();

    const scriptMatches = html.match(/static\/js\/(.*)\.js/) || [];
    const styleMatches = html.match(/static\/css\/(.*)\.css/) || [];

    if (!scriptMatches || scriptMatches.length === 0) {
      throw new Error(`Cannot find script urls in editor-build/index.html`);
    }

    if (!styleMatches || styleMatches.length === 0) {
      throw new Error(`Cannot find style urls in editor-build/index.html`);
    }

    const scriptUri =
      scriptMatches[0] &&
      webview.asWebviewUri(
        vscode.Uri.joinPath(root, "editor-build", scriptMatches[0])
      );
    const styleUri =
      styleMatches[0] &&
      webview.asWebviewUri(
        vscode.Uri.joinPath(root, "editor-build", styleMatches[0])
      );

    return `
    <script defer="defer" src="${scriptUri}"></script>
    <link href="${styleUri}" rel="stylesheet">
    `;
  }
};

export async function getWebviewContent(params: WebviewContentParams) {
  const {
    extensionUri,
    relativeFile,
    port,
    webview,
    initialFlow,
    dependencies,
    executionId,
    darkMode,
  } = params;
  const stylePath = vscode.Uri.joinPath(extensionUri, "media", "style.css");

  const wvStylePathwebview = webview.asWebviewUri(
    vscode.Uri.joinPath(stylePath)
  );

  const buildUri = webview.asWebviewUri(
    vscode.Uri.joinPath(extensionUri, "editor-build")
  );

  // const INITIAL_DATA = JSON.stringify({webviewId, initialFlow, dependencies});

  // on dev mode we want to load the webpack hot reloaded version of the iframe, for quick feedback loop

  const config = vscode.workspace.getConfiguration("flyde");

  const hasOpenAiToken = config.get("openAiToken") !== "";

  const bootstrapData = {
    initialFlow,
    dependencies,
    port,
    relativeFile,
    executionId,
    hasOpenAiToken,
    darkMode,
  };
  const serializedBootstrapData = Buffer.from(
    JSON.stringify(bootstrapData)
  ).toString("base64");

  return `<!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <meta http-equiv="Content-Security-Policy" content="default-src * 'unsafe-eval' 'unsafe-inline' ;script-src * 'unsafe-inline' 'unsafe-eval';img-src * 'self' data:;">
      <title>Cat Coding Bob</title>
      <link href="${wvStylePathwebview}" rel="stylesheet">
      <link href="https://fonts.googleapis.com/css?family=Montserrat|Roboto|Roboto+Condensed|Roboto+Mono"
        rel="stylesheet" />
    <link href="https://fonts.googleapis.com/css?family=Source+Code+Pro|Source+Sans+Pro" rel="stylesheet" />
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
      <style>
      body {

          
          padding: 0px;
      }
          iframe {
            width: 100vh;
            height: 100vh;
        }
      </style>
      ${await getScriptTagsFromReactAppHtml(extensionUri, webview, isDev)}
    </head>
    <body class="${darkMode ? "bp5-dark dark-mode" : ""}">
    <script type="text/javascript">
        window.__bootstrapData = "${serializedBootstrapData}"
    </script>

    <div id="root">
      <div style="display: flex; align-items: center;justify-content: center;height:100vh;width: 100vw;">
        <img src="${buildUri}/loader.svg" />
      </div>
    </div>

    </body>
    </html>`;
}
