import { loadFlydeYamlFile, loadFlydeYamlString } from "./flyde-yaml-loader";
import path from "path";
import fs from "fs";

// Example 1: Load a .flyde file directly
export function loadExampleHelloWorld() {
  const filePath = path.resolve(
    __dirname,
    "pages/_hero-example/ExampleHelloWorld.flyde"
  );
  return loadFlydeYamlFile(filePath);
}

// Example 2: Load a .flyde file content as string and parse it
export function loadExampleDebounceFromString() {
  const filePath = path.resolve(
    __dirname,
    "pages/_hero-example/ExampleDebounceThrottle.flyde"
  );
  const content = fs.readFileSync(filePath, "utf8");
  return loadFlydeYamlString(content);
}

// Example 3: Use the loader with the examples from _examples.ts
export function loadAllExamples() {
  const examplesDir = path.resolve(__dirname, "pages/_hero-example");
  const files = fs
    .readdirSync(examplesDir)
    .filter((file) => file.endsWith(".flyde"));

  return files.map((file) => {
    const filePath = path.join(examplesDir, file);
    return {
      fileName: file,
      ...loadFlydeYamlFile(filePath),
    };
  });
}
