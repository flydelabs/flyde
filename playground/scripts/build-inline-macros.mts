import { InternalMacroNode, isInternalMacroNode } from "@flyde/core";
import { promises as fs } from "fs";
import * as stdlib from "@flyde/stdlib/dist/all-browser.js";

import { createRequire } from "module";
import { dirname, join } from "path";

import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const require = createRequire(import.meta.url);
const stdlibPath = require.resolve("@flyde/stdlib/dist/all-browser.js");

const probePathStart = join(stdlibPath, "../ui/");

const targetFile = join(__dirname, "../stdlib-bundle/inline-macros.ts");

async function bundleMacros() {
  const macros = Object.values(stdlib).filter(
    isInternalMacroNode
  ) as unknown as InternalMacroNode<any>[];

  const macroBundlesContent = await macros.reduce<
    Promise<Record<string, string>>
  >(async (accPromise, macro) => {
    const acc = await accPromise;

    if (macro.editorConfig.type !== "custom") {
      return acc;
    }

    const fileName = macro.editorConfig.editorComponentBundlePath
      .split("/")
      .pop()!;

    const bundle = await fs.readFile(join(probePathStart, fileName), "utf-8");
    try {
      // Use Buffer to handle non-ASCII characters
      acc[macro.id] = Buffer.from(bundle, "utf-8").toString("base64");
    } catch (e) {
      throw new Error(`Failed to bundle macro ${macro.id}: ${e}`);
    }
    return acc;
  }, Promise.resolve({}));

  const macroBundlesContentString = JSON.stringify(macroBundlesContent);
  const macroBundlesContentStringWithExport = `export const macroBundlesContent = ${macroBundlesContentString};`;

  await fs.writeFile(targetFile, macroBundlesContentStringWithExport);
}

bundleMacros();
