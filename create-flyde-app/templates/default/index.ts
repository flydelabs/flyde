import { runFlow } from "@flyde/loader";
import path from "path";

async function main() {
  console.log("🚀 Running your first Flyde flow!");
  
  // Execute the flow directly
  const result = await runFlow(path.join(__dirname, "hello-world.flyde"), {});
  
  console.log("Result:", result);
  console.log("✅ Flow executed successfully!");
}

main().catch(console.error);