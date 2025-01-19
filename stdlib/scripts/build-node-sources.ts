// import fs from "fs";
// import path from "path";

// import { customCodeNodeFromCode } from "@flyde/core/dist/misc/custom-code-node-from-code";

// const srcDir = path.join(__dirname, "..", "src");
// const distDir = path.join(__dirname, "..", "dist", "sources");

// // Create the dist directory if it doesn't exist
// if (!fs.existsSync(distDir)) {
//   fs.mkdirSync(distDir, { recursive: true });
// }

// // Recursively scan the src directory for .flyde.ts files
// function scanDirectory(dir: string) {
//   const files = fs.readdirSync(dir);
//   files.forEach((file) => {
//     const filePath = path.join(dir, file);
//     const stat = fs.statSync(filePath);
//     if (stat.isDirectory()) {
//       scanDirectory(filePath);
//     } else if (file.endsWith(".flyde.ts")) {
//       //   console.log(`Found file: ${filePath}`);
//       processFile(filePath);
//     }
//   });
// }

// // function processFile(filePath: string) {
// //   try {
// //     const node = customCodeNodeFromCode(fs.readFileSync(filePath, "utf8"));
// //   } catch (e) {
// //     // console.error(`Error processing file: ${filePath}`);
// //     if (filePath.includes("Http")) {
// //       console.error(e);
// //     }
// //   }
// // }

// scanDirectory(srcDir);
