import { join, dirname } from "path";
import * as glob from "glob";

import resolveFrom from "resolve-from";

/**
 * Helper to require a module without caching
 */
const requireNoCache = (modulePath: string) => {
  delete require.cache[require.resolve(modulePath)];
  return require(modulePath);
};

export const resolveImportablePaths = (
  rootPath: string,
  importPath: string
): string[] => {
  const resolvedModulePath = resolveFrom(
    rootPath,
    importPath + "/package.json"
  );

  const { flyde } = requireNoCache(resolvedModulePath);

  if (!flyde || !flyde.exposes) {
    throw new Error(
      `Error importing ${importPath} - package.json does not contain a flyde.exposes field`
    );
  }

  const globs: string[] =
    typeof flyde.exposes === "string" ? [flyde.exposes] : flyde.exposes;

  const paths = globs.reduce((acc, pattern) => {
    const resolved = glob.sync(pattern, { cwd: dirname(resolvedModulePath) });
    return [...acc, ...resolved];
  }, []);

  return paths.map((path) => join(dirname(resolvedModulePath), path));
};
