import {
  DebuggerEvent,
  DebuggerEventType,
  debugLogger,
  entries,
  ERROR_PIN_ID,
} from "@flyde/core";
import { getInstanceDomId, getMainPinDomId, getPinDomId } from "../dom-ids";

const BLINK_TIMEOUT = 5000; // also change animation time in scss

const debug = debugLogger("runtime-player:play-event");

const getCancelTimerKey = (event: DebuggerEvent) => {
  /*
      on inputs and outputs the id is the ins + pin, and on others it's ins
      this ensures that clearing timeouts work across relevant elements only
     */
  if (
    event.type === DebuggerEventType.INPUT_CHANGE ||
    event.type === DebuggerEventType.OUTPUT_CHANGE
  ) {
    return `${event.parentInsId}.${event.insId}.${event.pinId}`;
  } else {
    return `${event.parentInsId}.${event.insId}`;
  }
};
export const cancelTimers = new Map();

export const playEvent = (editorInsId: string, event: DebuggerEvent) => {
  const timerKey = getCancelTimerKey(event);

  switch (event.type) {
    case DebuggerEventType.INPUT_CHANGE:
    case DebuggerEventType.OUTPUT_CHANGE: {
      const { pinId, insId, parentInsId } = event;
      const pinType =
        event.type === DebuggerEventType.INPUT_CHANGE ? "input" : "output";

      const domId =
        insId === editorInsId
          ? getMainPinDomId(insId, pinId, pinType)
          : getPinDomId(parentInsId, insId, pinId, pinType);
      const element = document.getElementById(domId);

      const connDomIdAttr = `${insId}.${pinId}`;
      const connectionElems =
        event.type === DebuggerEventType.OUTPUT_CHANGE
          ? document.querySelectorAll(`[data-from-id="${connDomIdAttr}"]`)
          : [];
      if (!element) {
        console.warn(`No DOM element with Id [${domId}] found to play event`);
        debug(`No DOM element with Id [${domId}] found to play event`, event);
      } else {
        clearTimeout(cancelTimers.get(timerKey));

        element.removeAttribute("data-runtime");
        connectionElems.forEach((connElem: any) => {
          connElem.removeAttribute("data-runtime");
        });

        setTimeout(() => {
          element.setAttribute("data-runtime", "active");
          connectionElems.forEach((connElem: any) => {
            connElem.setAttribute("data-runtime", "active");
          });
        }, 0);

        const timer = setTimeout(() => {
          element.removeAttribute("data-runtime");
          connectionElems.forEach((connElem: any) => {
            connElem.removeAttribute("data-runtime");
          });
          cancelTimers.delete(timerKey);
        }, BLINK_TIMEOUT);
        cancelTimers.set(getCancelTimerKey(event), timer);
      }
      break;
    }
    case DebuggerEventType.PROCESSING_CHANGE: {
      const { insId, parentInsId } = event;

      const domId = getInstanceDomId(parentInsId, insId);
      const element = document.getElementById(domId)?.parentElement;
      if (!element) {
        debug(`No DOM element with Id [${domId}] found to play event`, event);
        return;
      }

      if (event.val === true) {
        element.setAttribute("data-runtime", "processing");
        clearTimeout(cancelTimers.get(timerKey));
      } else {
        element.removeAttribute("data-runtime");
        setTimeout(() => {
          element.setAttribute("data-runtime", "done");
        }, 0);
        const timer = setTimeout(() => {
          element.removeAttribute("data-runtime");
          cancelTimers.delete(timerKey);
        }, BLINK_TIMEOUT);
        cancelTimers.set(timerKey, timer);
      }
      break;
    }
    case DebuggerEventType.ERROR: {
      const { insId, parentInsId } = event;

      const domId = getInstanceDomId(parentInsId, insId);
      const element = document.getElementById(domId)?.parentElement;
      if (!element) {
        debug(`No DOM element with Id [${domId}] found to play event`, event);
        return;
      }

      clearTimeout(cancelTimers.get(timerKey));
      element.removeAttribute("data-runtime");
      setTimeout(() => {
        element.setAttribute("data-runtime", "error");
      });
      const timer = setTimeout(() => {
        element.removeAttribute("data-runtime");
        cancelTimers.delete(timerKey);
      }, BLINK_TIMEOUT);
      cancelTimers.set(timerKey, timer);

      const fakeErrorPinEvent: DebuggerEvent = {
        ...event,
        type: DebuggerEventType.OUTPUT_CHANGE,
        pinId: ERROR_PIN_ID,
      };

      playEvent(editorInsId, fakeErrorPinEvent);
      break;
    }
    case DebuggerEventType.INPUTS_STATE_CHANGE: {
      entries(event.val).forEach(([k, v]) => {
        const { insId, parentInsId } = event;
        const domId = getPinDomId(parentInsId, insId, k, "input");
        const element = document.getElementById(domId);
        if (!element) {
          debug(`No DOM element with Id [${domId}] found to play event`, event);
          return;
        }
        if (v > 0) {
          element.setAttribute("data-runtime-queue", `${v}`);
        } else {
          element.removeAttribute("data-runtime-queue");
        }
      });
      break;
    }
  }
};
