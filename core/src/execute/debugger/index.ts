import { DebuggerEvent } from "./events";

export * from "./events";
export * from "./format-event";

export type DebuggerInterceptCommand = {
  cmd: "intercept";
  valuePromise: Promise<any>;
};

export type DebuggerCommand = DebuggerInterceptCommand | void;

export type Debugger = {
  onEvent?: <T extends DebuggerEvent>(
    event: Omit<T, "time" | "executionId">
  ) => DebuggerCommand;
  debugDelay?: number;
  destroy?: () => void;
};
