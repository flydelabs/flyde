import { DebuggerEvent, DebuggerEventType } from "./events";

function eventBody(event: DebuggerEvent) {
  switch (event.type) {
    case DebuggerEventType.PROCESSING_CHANGE:
      return event.val ? "started processing" : "stopped processing";
    case DebuggerEventType.INPUT_CHANGE:
      return `Input pin <${event.pinId}> received value: ${event.val}`;
    case DebuggerEventType.OUTPUT_CHANGE:
      return `Output pin <${event.pinId}> emitted value: ${event.val}`;
    case DebuggerEventType.INPUTS_STATE_CHANGE:
      return `Inputs queue size changed to ${Object.entries(event.val)
        .map(([pinId, size]) => `${pinId}: ${size}`)
        .join(", ")}`;
    case DebuggerEventType.ERROR:
      return `Error: ${event.val}`;
  }
}

export function formatEvent(event: DebuggerEvent) {
  const insIds = [event.insId, ...(event.ancestorsInsIds?.split(".") ?? [])];
  event.ancestorsInsIds?.length > 0 ? ` -> ${event.ancestorsInsIds}` : "";
  const prefix = `Node <${event.nodeId}> `;
  const suffix = `| Ins. id: ${insIds.join(" -> ")}`;
  return `${prefix} - ${eventBody(event)} ${suffix}`;
}
