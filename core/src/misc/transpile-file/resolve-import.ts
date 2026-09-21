/**
 * Utility to resolve import specifiers to a path that works after files are moved.
 *
 * The original implementation relied on the stored absolute path of the imported
 * file. When a user moves a file, that path becomes stale, breaking the flow.
 *
 * This helper attempts to resolve the import relative to the *current* file
 * location using Node's module resolution algorithm. If the specifier is a
 * relative path, it is resolved against the directory of the source file.
 * If it is a non‑relative specifier (e.g. a package or alias), we fall back
 * to `require.resolve` which respects `node_modules` and `tsconfig` paths.
 *
 * The function returns a path that can be used in the generated code.
 */

import * as fs from 'fs';
import * as path from 'path';

/**
 * Resolve an import specifier to a concrete file path.
 *
 * @param importSpecifier The raw import string from the source file.
 * @param sourceFilePath Absolute path of the file containing the import.
 * @returns A path that can be used in the transpiled output.
 */
export function resolveImportPath(
  importSpecifier: string,
  sourceFilePath: string
): string {
  // If the specifier is already absolute, just verify it exists.
  if (path.isAbsolute(importSpecifier)) {
    if (fs.existsSync(importSpecifier)) {
      return importSpecifier;
    }
    // If it doesn't exist, fall through to try resolution.
  }

  // Relative imports – resolve against the source file's directory.
  if (importSpecifier.startsWith('.')) {
    const candidate = path.resolve(path.dirname(sourceFilePath), importSpecifier);
    // Try adding extensions that TypeScript/Node may omit.
    const extensions = ['', '.ts', '.tsx', '.js', '.jsx', '.json'];
    for (const ext of extensions) {
      const fullPath = candidate + ext;
      if (fs.existsSync(fullPath) && fs.statSync(fullPath).isFile()) {
        // Return a path relative to the source file so that the generated code
        // keeps the same import style (relative).
        return path.relative(path.dirname(sourceFilePath), fullPath).replace(/\\/g, '/');
      }
    }
    // If we couldn't find a file, just return the original specifier – the
    // runtime will surface a clear error.
    return importSpecifier;
  }

  // Non‑relative specifiers – let Node resolve them (covers packages & tsconfig paths).
  try {
    const resolved = require.resolve(importSpecifier, {
      paths: [path.dirname(sourceFilePath)],
    });
    // Return a path relative to the source file for consistency.
    return path.relative(path.dirname(sourceFilePath), resolved).replace(/\\/g, '/');
  } catch {
    // If resolution fails, keep the original specifier.
    return importSpecifier;
  }
}
