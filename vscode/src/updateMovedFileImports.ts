import * as path from "path";

export interface RenamedFileEntry {
  oldFsPath: string;
  newFsPath: string;
}

export interface UpdateFlowContentResult {
  content: string;
  changed: boolean;
}

interface ParsedAbsPath {
  drive: string;
  posixPath: string;
}

function parseAbsPath(inputPath: string): ParsedAbsPath {
  const slashed = inputPath.replace(/\\/g, "/");
  const driveMatch = /^([a-zA-Z]:)(.*)$/.exec(slashed);
  if (driveMatch) {
    const drive = driveMatch[1].toLowerCase();
    const rawRest = driveMatch[2].startsWith("/") ? driveMatch[2] : `/${driveMatch[2]}`;
    return {
      drive,
      posixPath: path.posix.normalize(rawRest),
    };
  }
  return {
    drive: "",
    posixPath: path.posix.normalize(slashed),
  };
}

function normalizeForCompare(parsed: ParsedAbsPath): string {
  const joined = `${parsed.drive}${parsed.posixPath}`;
  if (parsed.drive) {
    return joined.toLowerCase();
  }
  return joined;
}

function stripTrailingSlash(p: string): string {
  if (p.length > 1 && p.endsWith("/")) {
    return p.slice(0, -1);
  }
  return p;
}

function dirnameAbs(fileAbs: ParsedAbsPath): ParsedAbsPath {
  return {
    drive: fileAbs.drive,
    posixPath: path.posix.dirname(fileAbs.posixPath),
  };
}

function resolveRelativeImport(baseDir: ParsedAbsPath, relImport: string): ParsedAbsPath {
  const cleanRel = relImport.replace(/\\/g, "/");
  return {
    drive: baseDir.drive,
    posixPath: path.posix.resolve(baseDir.posixPath, cleanRel),
  };
}

function relativePosixImport(fromDir: ParsedAbsPath, toFile: ParsedAbsPath): string {
  if (fromDir.drive !== toFile.drive) {
    return `${toFile.drive}${toFile.posixPath}`;
  }
  let rel = path.posix.relative(fromDir.posixPath, toFile.posixPath);
  if (!rel) {
    return `./${path.posix.basename(toFile.posixPath)}`;
  }
  if (!rel.startsWith("./") && !rel.startsWith("../") && rel !== "." && rel !== "..") {
    rel = `./${rel}`;
  }
  return rel;
}

function isRelativeFileReference(value: string): boolean {
  const trimmed = value.trim();
  return trimmed.startsWith("./") || trimmed.startsWith("../") || trimmed.startsWith(".\\") || trimmed.startsWith("..\\");
}

function resolveRenamedTarget(
  targetAbs: ParsedAbsPath,
  renamedFiles: ReadonlyArray<RenamedFileEntry>
): ParsedAbsPath {
  const targetCmp = stripTrailingSlash(normalizeForCompare(targetAbs));

  for (const entry of renamedFiles) {
    const oldAbs = parseAbsPath(entry.oldFsPath);
    const newAbs = parseAbsPath(entry.newFsPath);
    const oldCmp = stripTrailingSlash(normalizeForCompare(oldAbs));

    if (targetCmp === oldCmp) {
      return newAbs;
    }

    const oldPrefix = oldCmp.endsWith("/") ? oldCmp : `${oldCmp}/`;
    if (targetCmp.startsWith(oldPrefix)) {
      const subPath = targetAbs.posixPath.slice(stripTrailingSlash(oldAbs.posixPath).length);
      return {
        drive: newAbs.drive,
        posixPath: path.posix.normalize(`${stripTrailingSlash(newAbs.posixPath)}${subPath}`),
      };
    }
  }

  return targetAbs;
}

function unquoteYamlScalar(raw: string): { value: string; quote: '"' | "'" | "" } {
  const trimmed = raw.trim();
  if (trimmed.length >= 2 && trimmed.startsWith('"') && trimmed.endsWith('"')) {
    return { value: trimmed.slice(1, -1), quote: '"' };
  }
  if (trimmed.length >= 2 && trimmed.startsWith("'") && trimmed.endsWith("'")) {
    return { value: trimmed.slice(1, -1), quote: "'" };
  }
  return { value: trimmed, quote: "" };
}

function quoteYamlScalar(value: string, quote: '"' | "'" | ""): string {
  if (quote === '"') {
    return `"${value}"`;
  }
  if (quote === "'") {
    return `'${value}'`;
  }
  return value;
}

function computeUpdatedImportString(
  rawImport: string,
  oldFlowDir: ParsedAbsPath,
  newFlowDir: ParsedAbsPath,
  renamedFiles: ReadonlyArray<RenamedFileEntry>
): string | null {
  if (!isRelativeFileReference(rawImport)) {
    return null;
  }
  const targetBefore = resolveRelativeImport(oldFlowDir, rawImport);
  const targetAfter = resolveRenamedTarget(targetBefore, renamedFiles);
  const updated = relativePosixImport(newFlowDir, targetAfter);
  return updated !== rawImport ? updated : null;
}

function countIndent(line: string): number {
  let i = 0;
  while (i < line.length && line[i] === " ") {
    i++;
  }
  return i;
}

/**
 * Updates relative file references inside a `.flyde` YAML flow file when imported files,
 * folders, or the `.flyde` file itself are moved or renamed.
 */
export function updateFlowContentOnFileRename(
  flowContent: string,
  flowOldFsPath: string,
  flowNewFsPath: string,
  renamedFiles: ReadonlyArray<RenamedFileEntry>
): UpdateFlowContentResult {
  const lineEnding = flowContent.includes("\r\n") ? "\r\n" : "\n";
  const lines = flowContent.split(/\r?\n/);

  const oldFlowDir = dirnameAbs(parseAbsPath(flowOldFsPath));
  const newFlowDir = dirnameAbs(parseAbsPath(flowNewFsPath));
  let changed = false;

  // 1. Update top-level `imports:` map keys if present
  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i].trim();
    if (trimmed === "imports:" || trimmed.startsWith("imports:")) {
      const importsIndent = countIndent(lines[i]);
      if (trimmed === "imports:") {
        let j = i + 1;
        while (j < lines.length) {
          const subLine = lines[j];
          if (subLine.trim() === "" || subLine.trim().startsWith("#")) {
            j++;
            continue;
          }
          const subIndent = countIndent(subLine);
          if (subIndent <= importsIndent) {
            break;
          }
          if (subIndent === importsIndent + 2) {
            const keyMatch = /^(\s*)(["']?)([^"':]+)\2(\s*:.*)$/.exec(subLine);
            if (keyMatch) {
              const quoteChar = (keyMatch[2] as '"' | "'" | "") || "";
              const updated = computeUpdatedImportString(
                keyMatch[3],
                oldFlowDir,
                newFlowDir,
                renamedFiles
              );
              if (updated !== null) {
                lines[j] = `${keyMatch[1]}${quoteYamlScalar(updated, quoteChar)}${keyMatch[4]}`;
                changed = true;
              }
            }
          }
          j++;
        }
      }
      break;
    }
  }

  // 2. Update `source:` blocks where `type: file` (supports any key order inside `source:`)
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const sourceMatch = /^(\s*)source\s*:\s*(.*)$/.exec(line);
    if (!sourceMatch) {
      continue;
    }

    const trailing = sourceMatch[2].trim();
    // Handle single-line inline object: source: { type: "file", data: "./foo.flyde.ts" }
    if (trailing.startsWith("{") && trailing.includes("}")) {
      if (/type\s*:\s*["']?file["']?/.test(trailing)) {
        const nextLine = line.replace(
          /(data\s*:\s*)(["']?)([^"',}]+)\2/,
          (full: string, prefix: string, quote: string, val: string) => {
            const updated = computeUpdatedImportString(
              val.trim(),
              oldFlowDir,
              newFlowDir,
              renamedFiles
            );
            if (updated !== null) {
              changed = true;
              return `${prefix}${quoteYamlScalar(updated, (quote as '"' | "'" | "") || "")}`;
            }
            return full;
          }
        );
        lines[i] = nextLine;
      }
      continue;
    }

    if (trailing !== "") {
      continue;
    }

    const sourceIndent = countIndent(line);
    let isFileSource = false;
    let dataLineIndex = -1;
    let dataMatch: RegExpExecArray | null = null;

    let j = i + 1;
    while (j < lines.length) {
      const child = lines[j];
      const childTrim = child.trim();
      if (childTrim === "" || childTrim.startsWith("#")) {
        j++;
        continue;
      }
      const childIndent = countIndent(child);
      if (childIndent <= sourceIndent) {
        break;
      }

      if (childIndent === sourceIndent + 2) {
        const typeCheck = /^type\s*:\s*(.+)$/.exec(childTrim);
        if (typeCheck) {
          const parsedType = unquoteYamlScalar(typeCheck[1]);
          if (parsedType.value === "file") {
            isFileSource = true;
          }
        }
        const dm = /^(\s*data\s*:\s*)(.+)$/.exec(child);
        if (dm) {
          dataLineIndex = j;
          dataMatch = dm;
        }
      }
      j++;
    }

    if (isFileSource && dataLineIndex !== -1 && dataMatch) {
      const scalar = unquoteYamlScalar(dataMatch[2]);
      const updated = computeUpdatedImportString(
        scalar.value,
        oldFlowDir,
        newFlowDir,
        renamedFiles
      );
      if (updated !== null) {
        lines[dataLineIndex] = `${dataMatch[1]}${quoteYamlScalar(updated, scalar.quote)}`;
        changed = true;
      }
    }
  }

  return {
    content: lines.join(lineEnding),
    changed,
  };
}
