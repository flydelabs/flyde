import { dirname, isAbsolute, join, relative, resolve, sep } from "path";

export type PathMapper = (absPath: string) => string;

const FILE_SOURCE_REGEX =
  /(type:\s*file[ \t]*\r?\n[ \t]*data:[ \t]*)(["']?)(\.\.?\/[^"'\r\n]*?)\2([ \t]*(?:\r?\n|$))/g;

export function createRenameMapper(
  renames: { oldPath: string; newPath: string }[]
): PathMapper {
  return (absPath) => {
    for (const { oldPath, newPath } of renames) {
      if (absPath === oldPath) {
        return newPath;
      }
      if (absPath.startsWith(oldPath + sep)) {
        return join(newPath, absPath.slice(oldPath.length));
      }
    }
    return absPath;
  };
}

export function updateFlowReferences(
  text: string,
  oldFilePath: string,
  newFilePath: string,
  mapTarget: PathMapper
): string {
  const oldDir = dirname(oldFilePath);
  const newDir = dirname(newFilePath);
  return text.replace(
    FILE_SOURCE_REGEX,
    (match, prefix: string, quote: string, ref: string, suffix: string) => {
      const target = mapTarget(resolve(oldDir, ref));
      let newRef = relative(newDir, target).split(sep).join("/");
      if (isAbsolute(newRef)) {
        return match;
      }
      if (!newRef.startsWith(".")) {
        newRef = "./" + newRef;
      }
      return newRef === ref ? match : `${prefix}${quote}${newRef}${quote}${suffix}`;
    }
  );
}
