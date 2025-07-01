import { createRoot } from "react-dom/client";
import { VSCodeFlowEditor } from "./VSCodeFlowEditor";
import { getBootstrapData } from "./bootstrap";
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