import * as fs from "fs";
import * as path from "path";

interface NodeId {
  id: string;
  file: string;
}

function findFlydeFiles(dir: string): string[] {
  const files = fs.readdirSync(dir);
  let result: string[] = [];

  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      result = result.concat(findFlydeFiles(filePath));
    } else if (file.endsWith(".flyde.ts")) {
      result.push(filePath);
    }
  }

  return result;
}

function extractNodeId(content: string): string | null {
  const match = content.match(/id:\s*["']([^"']+)["']/);
  return match ? match[1] : null;
}

function checkUniqueNodeIds() {
  const srcDir = path.join(__dirname, "../src");
  const files = findFlydeFiles(srcDir);
  const nodeIds: NodeId[] = [];
  let hasError = false;

  for (const file of files) {
    const content = fs.readFileSync(file, "utf-8");
    const relativePath = path.relative(process.cwd(), file);
    const id = extractNodeId(content);

    if (id) {
      nodeIds.push({ id, file: relativePath });
    }
  }

  // Check for duplicates
  const idMap = new Map<string, string[]>();
  for (const { id, file } of nodeIds) {
    const normalizedId = id.toLowerCase(); // Case-insensitive comparison
    if (!idMap.has(normalizedId)) {
      idMap.set(normalizedId, []);
    }
    idMap.get(normalizedId)!.push(file);
  }

  for (const [id, files] of idMap.entries()) {
    if (files.length > 1) {
      console.error(`Duplicate node ID "${id}" found in files:`);
      files.forEach((file) => console.error(`  - ${file}`));
      hasError = true;
    }
  }

  if (hasError) {
    process.exit(1);
  } else {
    console.log("All node IDs are unique!");
  }
}

checkUniqueNodeIds();
