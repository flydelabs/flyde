import { generateTypesForDirectory } from "./generate-flow-types";
import { join } from "path";

async function testGeneration() {
  const fixtureDir = join(__dirname, "../../fixture");
  const outputPath = join(__dirname, "generated-types.test.ts");
  
  try {
    await generateTypesForDirectory(fixtureDir, outputPath);
    console.log("✅ Test generation completed successfully");
  } catch (error) {
    console.error("❌ Test generation failed:", error);
  }
}

testGeneration();