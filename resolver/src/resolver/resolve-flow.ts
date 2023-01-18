import {
  isVisualPart,
  ResolvedFlydeFlow
} from "@flyde/core";
import { readFileSync } from "fs";
import _ = require("lodash");
import { deserializeFlow } from "../serdes/deserialize";
import { resolveDependencies } from "./resolve-dependencies/resolve-dependencies";

export type ResolveMode = "implementation" | "definition";


const _resolveFlow = (
  fullFlowPath: string,
  mode: ResolveMode = "definition"
): ResolvedFlydeFlow => {
  const flow = deserializeFlow(
    readFileSync(fullFlowPath, "utf8"),
    fullFlowPath
  );

  const part = flow.part;
  return { main: part, dependencies: resolveDependencies(flow, mode, fullFlowPath) };
};

export const resolveFlow = _resolveFlow;
