import path from "path";
import fs from "fs";

/**
 * This script tests that the bundled configs are correctly generated
 * Run it after building with: ts-node scripts/test-bundled-config.ts
 */

const bundledConfigDir = path.resolve(__dirname, "../dist/bundled-config");
const uiDistDir = path.resolve(__dirname, "../dist/ui");

function testBundledConfigs() {
  if (!fs.existsSync(bundledConfigDir)) {
    console.error(`Bundled config directory not found at ${bundledConfigDir}`);
    process.exit(1);
  }

  const files = fs.readdirSync(bundledConfigDir);
  const jsFiles = files.filter(
    (file) => file.endsWith(".js") && file !== "index.js"
  );

  if (jsFiles.length === 0) {
    console.error("No bundled config files found");
    process.exit(1);
  }

  console.log(`Found ${jsFiles.length} bundled config files:`);
  jsFiles.forEach((file) => {
    const nodeId = path.basename(file, ".js");
    console.log(` - ${nodeId}`);

    // Check if source file exists
    const sourceFile = path.join(uiDistDir, `${nodeId}.js`);
    if (!fs.existsSync(sourceFile)) {
      console.error(`  ERROR: Source file not found at ${sourceFile}`);
      return;
    }

    // Check if the content is encoded correctly
    const bundledContent = fs.readFileSync(
      path.join(bundledConfigDir, file),
      "utf-8"
    );
    if (!bundledContent.includes("encodedContent")) {
      console.error(`  ERROR: ${file} does not contain encoded content`);
      return;
    }

    // Check if d.ts file exists
    const dtsFile = path.join(bundledConfigDir, `${nodeId}.d.ts`);
    if (!fs.existsSync(dtsFile)) {
      console.error(
        `  ERROR: TypeScript definition file not found at ${dtsFile}`
      );
      return;
    }

    console.log(`  ✓ ${nodeId} validation passed`);
  });

  // Check if index files exist
  const indexFile = path.join(bundledConfigDir, "index.js");
  const indexDtsFile = path.join(bundledConfigDir, "index.d.ts");

  if (!fs.existsSync(indexFile)) {
    console.error(`ERROR: Index file not found at ${indexFile}`);
  } else {
    console.log("✓ index.js exists");
  }

  if (!fs.existsSync(indexDtsFile)) {
    console.error(
      `ERROR: TypeScript index definition file not found at ${indexDtsFile}`
    );
  } else {
    console.log("✓ index.d.ts exists");
  }

  console.log("Test completed.");
}

testBundledConfigs();
