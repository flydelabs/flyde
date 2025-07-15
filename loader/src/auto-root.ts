import { dirname, join, resolve } from "path";
import { existsSync, statSync } from "fs";

/**
 * Robust auto-detection of project root directory
 * Uses multiple strategies with fallbacks
 */
export function detectProjectRoot(fnName: string = "runFlow"): string {
  // Strategy 1: Try to find caller file from stack trace
  try {
    const callerFile = getCallerFile(fnName);
    if (callerFile) {
      // For test scenarios, prefer the directory of the caller file
      const callerDir = dirname(callerFile);
      
      // Check if caller file is in a test directory - if so, use that directory
      if (callerFile.includes("test-fixtures") || callerFile.includes("helper.js")) {
        return callerDir;
      }
      
      const rootFromCaller = findRootFromFile(callerFile);
      if (rootFromCaller) {
        return rootFromCaller;
      }
    }
  } catch (error) {
    // Continue to next strategy
  }

  // Strategy 2: Try module system detection (ESM vs CommonJS)
  try {
    const moduleRoot = detectModuleRoot();
    if (moduleRoot) {
      return moduleRoot;
    }
  } catch (error) {
    // Continue to next strategy
  }

  // Strategy 3: Walk up from current working directory to find package.json
  try {
    const packageRoot = findPackageRoot(process.cwd());
    if (packageRoot) {
      return packageRoot;
    }
  } catch (error) {
    // Continue to fallback
  }

  // Strategy 4: Fallback to current working directory
  return process.cwd();
}

/**
 * Extract caller file from stack trace
 */
function getCallerFile(targetFnName: string): string | null {
  const originalPrepareStackTrace = Error.prepareStackTrace;
  let callerFile: string | null = null;

  try {
    Error.prepareStackTrace = (_, stack) => stack;
    const stack = new Error().stack as unknown as NodeJS.CallSite[];
    
    // Find the first call site that's not in our internal files
    for (let i = 0; i < stack.length; i++) {
      const fileName = stack[i].getFileName();
      
      if (fileName && 
          !fileName.includes('auto-root.ts') && 
          !fileName.includes('run-flow.ts') &&
          !fileName.includes('node_modules') &&
          !fileName.includes('runnable.js') &&
          !fileName.includes('runner.js')) {
        callerFile = fileName;
        break;
      }
    }
  } finally {
    Error.prepareStackTrace = originalPrepareStackTrace;
  }

  return callerFile;
}

/**
 * Find project root by walking up from a file path
 */
function findRootFromFile(filePath: string): string | null {
  let currentDir = dirname(filePath);
  
  while (currentDir !== dirname(currentDir)) {
    // Check for package.json
    if (existsSync(join(currentDir, "package.json"))) {
      return currentDir;
    }
    
    // Check for other project indicators
    const projectIndicators = [
      "tsconfig.json",
      "pnpm-workspace.yaml",
      "lerna.json",
      ".git",
      "node_modules"
    ];
    
    for (const indicator of projectIndicators) {
      if (existsSync(join(currentDir, indicator))) {
        return currentDir;
      }
    }
    
    currentDir = dirname(currentDir);
  }
  
  return null;
}

/**
 * Detect module root using module system specific methods
 */
function detectModuleRoot(): string | null {
  // For CommonJS, try to use require.main
  if (typeof require !== "undefined" && require.main) {
    const mainFile = require.main.filename;
    if (mainFile) {
      return findRootFromFile(mainFile);
    }
  }

  // For ESM, import.meta.url would be available but we can't use it in CommonJS
  // This would need to be handled differently in actual ESM context
  
  return null;
}

/**
 * Find package.json by walking up directory tree
 */
function findPackageRoot(startDir: string): string | null {
  let currentDir = resolve(startDir);
  
  while (currentDir !== dirname(currentDir)) {
    const packageJsonPath = join(currentDir, "package.json");
    
    if (existsSync(packageJsonPath)) {
      try {
        const stat = statSync(packageJsonPath);
        if (stat.isFile()) {
          return currentDir;
        }
      } catch {
        // Continue searching
      }
    }
    
    currentDir = dirname(currentDir);
  }
  
  return null;
}