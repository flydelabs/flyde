import { DebuggerEvent } from "./events";

export * from "./events";
export * from './format-event';

export type DebuggerInterceptCommand = {
  cmd: "intercept";
  valuePromise: Promise<any>;
};

export type DebuggerCommand = DebuggerInterceptCommand | void;

export interface BaseDebuggerData {
  pinId?: string;
  insId: string;
  parentInsId: string;
  time: number;
}

export type Debugger = {
  onEvent?: <T extends DebuggerEvent>(event: Omit<T, 'time'>) => DebuggerCommand;
  debugDelay?: number;
  destroy?: () => void;
};
