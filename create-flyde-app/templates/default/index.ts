import { loadFlow } from "@flyde/loader";
import path from "path";

async function main() {
  console.log("🚀 Running your first Flyde flow!");
  
  // Load the visual flow
  const helloWorldFlow = loadFlow(path.join(__dirname, "hello-world.flyde"));
  
  // Execute the flow
  const result = await helloWorldFlow({}).result;
  
  console.log("Result:", result);
  console.log("✅ Flow executed successfully!");
}

main().catch(console.error);