import { EditorVisualNode } from "@flyde/core";
import * as vscode from "vscode";

export type WebviewContentParams = {
  extensionUri: vscode.Uri;
  relativeFile: string;
  executionId: string;
  port: number;
  webview: vscode.Webview;
  initialNode: EditorVisualNode;
  webviewId: string;
  darkMode: boolean;
};

const isDev = process.env.MODE === "dev";

const { fs } = vscode.workspace;

const getViteAssets = async (
  root: vscode.Uri,
  webview: vscode.Webview,
  isDev: boolean
) => {
  
    // Read the built manifest to get the asset files
    const manifestPath = vscode.Uri.joinPath(root, "webview-dist/.vite/manifest.json");
    let manifest: any = {};
    
    try {
      const manifestContent = await fs.readFile(manifestPath);
      manifest = JSON.parse(manifestContent.toString());
    } catch (error) {
      throw new Error(`Cannot find or parse webview-dist/.vite/manifest.json: ${error}`);
    }

    const indexEntry = manifest["index.html"];
    if (!indexEntry) {
      throw new Error("Cannot find index.html entry in Vite manifest");
    }

    let scriptTags = '';
    let styleTags = '';

    // Add the main JS file
    if (indexEntry.file) {
      const scriptUri = webview.asWebviewUri(
        vscode.Uri.joinPath(root, "webview-dist", indexEntry.file)
      );
      scriptTags += `<script type="module" src="${scriptUri}"></script>`;
    }

    // Add CSS files
    if (indexEntry.css) {
      for (const cssFile of indexEntry.css) {
        const styleUri = webview.asWebviewUri(
          vscode.Uri.joinPath(root, "webview-dist", cssFile)
        );
        styleTags += `<link href="${styleUri}" rel="stylesheet">`;
      }
    }

    return { scriptTags, styleTags };
  }

export async function getWebviewContent(params: WebviewContentParams) {
  const {
    extensionUri,
    relativeFile,
    port,
    webview,
    initialNode,
    executionId,
    darkMode,
  } = params;
  const stylePath = vscode.Uri.joinPath(extensionUri, "media", "style.css");

  const wvStylePathwebview = webview.asWebviewUri(
    vscode.Uri.joinPath(stylePath)
  );

  const { scriptTags, styleTags } = await getViteAssets(extensionUri, webview, isDev);

  // const INITIAL_DATA = JSON.stringify({webviewId, initialFlow, dependencies});

  // on dev mode we want to load the webpack hot reloaded version of the iframe, for quick feedback loop

  const config = vscode.workspace.getConfiguration("flyde");

  const hasOpenAiToken = config.get("openAiToken") !== "";


  const bootstrapData = {
    initialNode,
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
    <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&display=swap" rel="stylesheet">
      <style>
      body {

          
          padding: 0px;
      }
          iframe {
            width: 100vh;
            height: 100vh;
        }
      </style>
      ${styleTags}
    </head>
    <body class="${darkMode ? "dark" : ""}">
    <script type="text/javascript">
        window.__bootstrapData = "${serializedBootstrapData}"
    </script>

    <div id="root">
      <div style="display: flex; align-items: center;justify-content: center;height:100vh;width: 100vw;">
        Loading...
      </div>
    </div>

    ${scriptTags}
    </body>
    </html>`;
}
