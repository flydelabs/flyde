import { loader } from "@monaco-editor/react";
import { logger } from "./logger";

let preloaded = false;
export const preloadMonaco = () => {
  if (preloaded) {
    return;
  }
  loader.init().then(() => {
    logger("monaco preloaded");
    preloaded = true;
  });
};
