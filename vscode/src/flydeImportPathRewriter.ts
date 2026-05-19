import * as path from "path";

type RewriteCandidate = {
  dataLineIndex: number;
  importPath: string;
  quote: string;
};

export function isFlydeFile(filePath: string) {
  return filePath.endsWith(".flyde");
}

export function toFlydeImportPath(fromFlowPath: string, targetPath: string) {
  const fromDir = path.dirname(fromFlowPath);
  const relativePath = path.relative(fromDir, targetPath).replace(/\\/g, "/");

  if (relativePath.startsWith(".")) {
    return relativePath;
  }

  return `./${relativePath}`;
}

export function rewriteMovedFlowImports(
  content: string,
  oldFlowPath: string,
  newFlowPath: string
) {
  return rewriteFileSourceImports(content, (importPath) => {
    const originalTargetPath = path.resolve(path.dirname(oldFlowPath), importPath);
    return toFlydeImportPath(newFlowPath, originalTargetPath);
  });
}

export function rewriteReferencesToMovedFile(
  content: string,
  flowPath: string,
  oldTargetPath: string,
  newTargetPath: string
) {
  return rewriteFileSourceImports(content, (importPath) => {
    const resolvedImportPath = path.resolve(path.dirname(flowPath), importPath);

    if (!samePath(resolvedImportPath, oldTargetPath)) {
      return importPath;
    }

    return toFlydeImportPath(flowPath, newTargetPath);
  });
}

function rewriteFileSourceImports(
  content: string,
  rewriteImportPath: (importPath: string) => string
) {
  const hasTrailingNewline = content.endsWith("\n");
  const lines = content.split(/\r?\n/);

  const candidates = findFileSourceImportCandidates(lines);

  for (const candidate of candidates) {
    const rewrittenImportPath = rewriteImportPath(candidate.importPath);

    if (rewrittenImportPath === candidate.importPath) {
      continue;
    }

    lines[candidate.dataLineIndex] = lines[candidate.dataLineIndex].replace(
      /(\bdata:\s*)(['"]?)(.+?)(\2)\s*$/,
      `$1${candidate.quote}${rewrittenImportPath}${candidate.quote}`
    );
  }

  const rewritten = lines.join("\n");
  return hasTrailingNewline ? rewritten : rewritten.replace(/\n$/, "");
}

function findFileSourceImportCandidates(lines: string[]) {
  const candidates: RewriteCandidate[] = [];

  for (let sourceLineIndex = 0; sourceLineIndex < lines.length; sourceLineIndex++) {
    const sourceLine = lines[sourceLineIndex];
    const sourceMatch = sourceLine.match(/^(\s*)(-\s*)?source:\s*$/);

    if (!sourceMatch) {
      continue;
    }

    const sourceIndent = sourceMatch[1].length + (sourceMatch[2]?.length ?? 0);
    let hasFileType = false;
    let dataLineIndex = -1;
    let importPath = "";
    let quote = "";

    for (let index = sourceLineIndex + 1; index < lines.length; index++) {
      const line = lines[index];

      if (line.trim() === "") {
        continue;
      }

      const currentIndent = line.match(/^(\s*)/)?.[1].length ?? 0;

      if (currentIndent <= sourceIndent) {
        break;
      }

      const typeMatch = line.match(/^\s*type:\s*file\s*$/);
      if (typeMatch) {
        hasFileType = true;
        continue;
      }

      const dataMatch = line.match(/^\s*data:\s*(['"]?)(.+?)\1\s*$/);
      if (dataMatch) {
        dataLineIndex = index;
        quote = dataMatch[1];
        importPath = dataMatch[2];
      }
    }

    if (hasFileType && dataLineIndex !== -1) {
      candidates.push({ dataLineIndex, importPath, quote });
    }
  }

  return candidates;
}

function samePath(left: string, right: string) {
  const normalizedLeft = path.resolve(left);
  const normalizedRight = path.resolve(right);

  if (process.platform === "win32") {
    return normalizedLeft.toLowerCase() === normalizedRight.toLowerCase();
  }

  return normalizedLeft === normalizedRight;
}
