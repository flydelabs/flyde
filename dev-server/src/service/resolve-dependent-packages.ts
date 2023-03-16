import { PartDefRepo } from "@flyde/core";
import { deserializeFlow, isCodePartPath, resolveCodePartDependencies, resolveImportablePaths } from "@flyde/resolver";
import { readFileSync } from "fs";

export async function resolveDependentPackages (
    rootPath: string,
    flydeDependencies: string[]
  ) {
    return flydeDependencies.reduce<Record<string, PartDefRepo>>((acc, dep) => {
      try {
        const paths = resolveImportablePaths(rootPath, dep);
        const parts = paths.reduce((acc, filePath) => {
  
          if (isCodePartPath(filePath))  {
            const obj = resolveCodePartDependencies(filePath).reduce((obj, {part}) => ({...obj, [part.id]: part}), {});
            return {...acc, ...obj}
          }
          try {
            const flow = deserializeFlow(readFileSync(filePath, "utf8"), filePath);
            return { ...acc, [flow.part.id]: flow.part };
          } catch (e) {
            console.error(`Skipping corrupt flow at ${filePath}, error: ${e}`);
            return acc;
          }
        }, {});
        return { ...acc, [dep]: parts };
      } catch (e) {
        console.log(`skipping invalid dependency ${dep}`);
        return acc;
      }
      // return acc;
    }, {});
  };
  