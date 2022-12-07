import { fromEventPattern } from 'rxjs';
import { DebuggerEvent } from './events';

export * from './events';

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
  onEvent?: <T>(event: DebuggerEvent) => DebuggerCommand;
  debugDelay?: number;
  destroy?: () => void;
};
