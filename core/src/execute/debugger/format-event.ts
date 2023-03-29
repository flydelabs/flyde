import { DebuggerEvent, DebuggerEventType } from "./events";


function eventBody(event: DebuggerEvent) {
    switch (event.type) {
        case DebuggerEventType.PROCESSING_CHANGE:
            return event.val ? 'started processing' : 'stopped processing';
        case DebuggerEventType.INPUT_CHANGE:
            return `Input pin <${event.pinId}> changed to ${event.val}`;
        case DebuggerEventType.OUTPUT_CHANGE:
            return `Output pin <${event.pinId}> changed to ${event.val}`;
        case DebuggerEventType.INPUTS_STATE_CHANGE:
            return `Inputs queue size changed to ${Object.entries(event.val).map(([pinId, size]) => `${pinId}: ${size}`).join(', ')}`;
        case DebuggerEventType.ERROR:
            return `**Error**: ${event.val}`;
    }
}

export function formatEvent (event: DebuggerEvent) {
    const prefix = `Part <${event.partId}> (ins. ${event.insId} -> ${event.ancestorsInsIds})`;
    return `${prefix} - ${eventBody(event)}`;
}