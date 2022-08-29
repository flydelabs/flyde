import * as vscode from 'vscode';


export function getWebviewContent(extensionUri: vscode.Uri, relativeFile: string, port: number, webview: vscode.Webview) {
    const stylePath = vscode.Uri.joinPath(extensionUri, 'media', 'style.css');

    const wvStylePathwebview = webview.asWebviewUri(vscode.Uri.joinPath(stylePath));

    console.log({wvStylePathwebview});
    
    
    
    return `<!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <meta http-equiv="Content-Security-Policy" content="default-src * 'unsafe-eval' 'unsafe-inline' ;script-src *">
      <title>Cat Coding Bob</title>
      <link href="${wvStylePathwebview}" rel="stylesheet">
    
    
      <style>
      body {
          background: white;
          padding: 0px;
      }
          iframe {
            width: 100vh;
            height: 100vh;
        }
      </style>
    </head>
    <body>
    <iframe src="http://localhost:${port}/editor/files?fileName=${encodeURIComponent(relativeFile)}&port=${port}" style="width: 100vw; height: 100vh" sandbox="allow-scripts allow-modals"/>
    
    </body>
    </html>`;
}


