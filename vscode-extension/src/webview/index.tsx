import { createRoot } from "react-dom/client";
import { VSCodeFlowEditor } from "./VSCodeFlowEditor";
import { getBootstrapData } from "./bootstrap";
import { safelyAcquireApi } from "./vscode-ports";
import "./index.css";

const bootstrap = getBootstrapData();

const root = createRoot(document.getElementById("root") as HTMLElement);

if (!bootstrap) {
  // Show a nice error message
  root.render(
    <div style={{ padding: "20px", color: "#666", backgroundColor: "#1e1e1e", textAlign: "center" }}>
      <h1>Unable to load flow editor</h1>
      <p>Please try reopening the file</p>
    </div>
  );
} else {
  root.render(<VSCodeFlowEditor {...bootstrap} />);
}


window.addEventListener("message", (event) => {
  const { data } = event;
  if (data && data.type === "__webviewTestingCommand") {
    let response: any;
    let error: any;
    switch (data.command) {
      case "$$": {
        const { selector } = data.params;
        const elements = document.querySelectorAll(selector);
        response = Array.from(elements).map((element) => {
          return {
            innerHTML: element.innerHTML,
            textContent: element.textContent,
            outerHTML: element.outerHTML,
          };
        });
        break;
      }
      case "click": {
        const { selector } = data.params;
        const element = document.querySelector(selector);
        if (element) {
          element.click();
          response = {};
        } else {
          error = `Element not found: ${selector}`;
        }
        break;
      }
      default: {
        error = `Unknown command: ${data.command}`;
      }
    }

    const vscode = safelyAcquireApi();
    
    if (!vscode) {
      return;
    }

    vscode.postMessage(
      { type: "__webviewTestingResponse", response, error },
      "*"
    );
  }
});