import { writeFileSync } from "fs";
import { isAbsolute, join } from "path";
import { runDevServer } from "./server";
import { generateTypings } from "./service/generate-typings";
import { setupFlowsWatcher } from "./setup-flows-watcher";

const TYPINGS_TARGET = "src/flyde-typings.d.ts";

export type InitFlydeDevServerOptions = {
  port: number;
  root: string;
  editorStaticsRoot: string;
};

export const initFlydeDevServer = (
  options: InitFlydeDevServerOptions
): (() => void) => {
  const root = isAbsolute(options.root)
    ? options.root
    : join(process.cwd(), options.root);

  console.log("running dev server on", options.port, "root", root);

  const server = runDevServer(
    Number(options.port),
    root,
    options.editorStaticsRoot
  );
  console.log("running dev server on", options.port, "root", root);

  const watcher = setupFlowsWatcher(root, (flows) => {
    const flowsArr = Array.from(flows.entries()).map(([k, v]) => ({
      relativePath: k,
      flow: v,
      fileName: k.split("/").pop(),
    }));

    const typings = generateTypings(flowsArr);

    writeFileSync(join(root, TYPINGS_TARGET), typings);
  });

  return async function cleanDevServer() {
    await server.close();
    await watcher.close();
  };
};
