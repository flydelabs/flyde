const findGitRoot = require("find-git-root");

import { existsSync, readFileSync } from "fs";
import ignore from "ignore";
import { join, relative } from "path";

let cache = {};

const safelyGetGitRoot = (path: string): string | undefined => {
  if (cache[path]) {
    return cache[path];
  }
  try {
    let root = findGitRoot(path);
    if (root) {
      root = join(root, ".."); // find git root finds the ".git" folder, we want the parent folder
      cache[path] = root;
    }
    return root;
  } catch (e) {
    return undefined;
  }
};

export const defaultScanFilter = (path: string, root: string): boolean => {
  const gitRoot = safelyGetGitRoot(root);
  const ignoreFilePath = gitRoot && join(gitRoot, "../.gitignore");

  if (gitRoot && existsSync(ignoreFilePath)) {
    const relativePath = relative(path, gitRoot);

    const ig = ignore().add(readFileSync(ignoreFilePath, "utf-8"));
    const ignores = ig.ignores(relativePath);

    return !ignores;
  } else {
    return !path.includes("node_modules") && !path.includes("dist");
  }
};
