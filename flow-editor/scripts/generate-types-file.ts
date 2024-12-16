import { readFileSync, writeFileSync } from "fs";
import { join } from "path";

const typesContent = readFileSync(
  join(__dirname, "../src/types/@flyde-core.d.ts"),
  "utf-8"
);

// Escape backticks in the content
const escapedContent = typesContent.replace(/`/g, "\\`");

const fileContent = `// This file is auto-generated
export const flydeCoreTypes = \`${escapedContent}\`;
`;

writeFileSync(join(__dirname, "../src/types/flyde-core-types.ts"), fileContent);
