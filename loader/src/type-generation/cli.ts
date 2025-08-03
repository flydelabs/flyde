#!/usr/bin/env node

import { join } from "path";
import { generateTypesForDirectory } from "./generate-flow-types";

async function main() {
  const args = process.argv.slice(2);
  
  if (args.length < 1) {
    console.error("Usage: generate-flow-types <root-directory> [output-file]");
    console.error("Example: generate-flow-types ./src ./src/generated/flow-types.ts");
    process.exit(1);
  }

  const rootDir = args[0];
  const outputPath = args[1] || join(rootDir, "flow-types.generated.ts");

  try {
    console.log(`Generating flow types from ${rootDir}...`);
    await generateTypesForDirectory(rootDir, outputPath);
    console.log(`✅ Types generated successfully at ${outputPath}`);
  } catch (error) {
    console.error("❌ Failed to generate types:", error);
    process.exit(1);
  }
}

if (require.main === module) {
  main().catch(console.error);
}