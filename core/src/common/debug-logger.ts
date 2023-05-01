import debug from "debug";

const BASE_NS = `flyde`;

const base = debug(BASE_NS);

import type { Debugger as _Debugger } from "debug";

export type DebugLogger = _Debugger;

export const debugLogger = (subNs: string): DebugLogger => {
  return base.extend(subNs);
};
