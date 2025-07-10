import * as fs from "fs";
import * as path from "path";
import * as os from "os";

/**
 * Recursively copies a source file or directory to a destination
 * @param src - Source path (file or directory)
 * @param dest - Destination path
 */
export function copyRecursive(src: string, dest: string): void {
  const stats = fs.statSync(src);
  if (stats.isDirectory()) {
    fs.mkdirSync(dest, { recursive: true });
    fs.readdirSync(src).forEach(childItemName => {
      copyRecursive(
        path.join(src, childItemName),
        path.join(dest, childItemName)
      );
    });
  } else {
    fs.copyFileSync(src, dest);
  }
}

/**
 * Creates a temporary directory with all test fixtures copied
 * @param fixturesDir - Path to the test fixtures directory
 * @param templatesDir - Path to the templates directory
 * @returns Path to the temporary directory
 */
export function createTempTestWorkspace(fixturesDir: string, templatesDir: string): string {
  const tmpDir = path.join(os.tmpdir(), `flyde-test-fixtures-${Date.now()}`);

  if (fs.existsSync(tmpDir)) {
    throw new Error("Temporary directory already exists");
  }

  fs.mkdirSync(tmpDir, { recursive: true });

  // Copy test fixtures recursively
  fs.readdirSync(fixturesDir).forEach((file) => {
    const source = path.join(fixturesDir, file);
    const dest = path.join(tmpDir, file);
    copyRecursive(source, dest);
  });

  // Copy templates
  fs.readdirSync(templatesDir).forEach((templateFolder) => {
    // Skip hidden files like .DS_Store
    if (templateFolder.startsWith('.')) {
      return;
    }

    const source = path.join(templatesDir, templateFolder, `Example.flyde`);
    const dest = path.join(tmpDir, `${templateFolder}.flyde`);
    if (fs.existsSync(source)) {
      fs.copyFileSync(source, dest);
    }
  });

  return tmpDir;
}