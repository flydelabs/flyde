import { ChildProcess } from "child_process";
import type { runFlow } from "./run-flow";
import { FlowJob } from "@flyde/core";

export interface ProcessMessageEventsMap {
  runFlow: Parameters<typeof runFlow>;
  runFlowResult: FlowJob;
  runFlowCompleted: Record<string, any>;
  runFlowError: Error;
  destroyRunFlow: void;
}

export type ProcessMessageEventType = keyof ProcessMessageEventsMap;

export function sendMessage<T extends ProcessMessageEventType>(
  process: NodeJS.Process | ChildProcess,
  type: T,
  data: ProcessMessageEventsMap[T]
) {
  process.send?.({ type, data });
}

export function onMessage<T extends ProcessMessageEventType>(
  process: NodeJS.Process | ChildProcess,
  type: T,
  callback: (data: ProcessMessageEventsMap[T]) => void
) {
  function handler(message: { type: ProcessMessageEventType; data: any }) {
    if (message.type === type) {
      callback(message.data);
      process.removeListener("message", handler);
    }
  }

  process.on("message", handler);
}