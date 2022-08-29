import { debugLogger, entries } from "@flyde/core";
import { RuntimeEvent, RuntimeEventType } from "@flyde/remote-debugger";
import { getInstanceDomId, getPinDomId } from "../dom-ids";

const BLINK_TIMEOUT = 2000; // also change animation time in scss

const debug = debugLogger("runtime-player:play-event");

const getCancelTimerKey = (event: RuntimeEvent) => {
  /*
      on inputs and outputs the id is the ins + pin, and on others it's ins
      this ensures that clearing timeouts work across relevant elements only
     */
  return `${event.id}`;
};
export const cancelTimers = new Map();

export const playEvent = (parentInsId: string, event: RuntimeEvent) => {
  const timerKey = getCancelTimerKey(event);

  switch (event.type) {
    case RuntimeEventType.INPUT_CHANGE:
    case RuntimeEventType.OUTPUT_CHANGE: {
      const [pinType, pinId, insId, ...parentInsIdParts] = event.id.split(".").reverse();

      const parentInsId = parentInsIdParts.reverse().join(".");

      const domId = getPinDomId(parentInsId, insId, pinId, pinType);
      const element = document.getElementById(domId);

      const connDomIdAttr = `${insId}.${pinId}`;
      const connectionElems =
        event.type === RuntimeEventType.OUTPUT_CHANGE
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
        }, 0)

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
    case RuntimeEventType.PROCESSING_CHANGE: {
      const [insId, ...parentInsIdParts] = event.id.split(".").reverse();
      const parentInsId = parentInsIdParts.reverse().join(".");

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

        element.removeAttribute('data-runtime');
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
    case RuntimeEventType.ERROR: {
      const [insId, ...parentInsIdParts] = event.id.split(".").reverse();
      const parentInsId = parentInsIdParts.reverse().join(".");

      const domId = getInstanceDomId(parentInsId, insId);
      const element = document.getElementById(domId)?.parentElement;
      if (!element) {
        debug(`No DOM element with Id [${domId}] found to play event`, event);
        return;
      }

      clearTimeout(cancelTimers.get(timerKey));
      element.setAttribute("data-runtime", "error");
      const timer = setTimeout(() => {
        element.removeAttribute("data-runtime");
        cancelTimers.delete(timerKey);
      }, BLINK_TIMEOUT);
      cancelTimers.set(timerKey, timer);
      break;
    }
    case RuntimeEventType.INPUTS_STATE_CHANGE: {
      entries(event.val).forEach(([k, v]) => {
        const [insId, ...parentInsIdParts] = event.id.split(".").reverse();
        const parentInsId = parentInsIdParts.reverse().join(".");
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
