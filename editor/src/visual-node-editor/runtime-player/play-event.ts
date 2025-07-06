import {
  DebuggerEvent,
  DebuggerEventType,
  debugLogger,
  entries,
  ERROR_PIN_ID,
  fullInsIdPath,
  ROOT_INS_ID,
} from "@flyde/core";
import {
  getInstanceDomId,
  getMainInstanceIndicatorDomId,
  getMainPinDomId,
  getPinDomId,
} from "../dom-ids";

const BLINK_TIMEOUT = 20000; // also change animation time in scss

const debug = debugLogger("runtime-player:play-event");

const getCancelTimerKey = (event: DebuggerEvent, suffix?: string) => {
  /*
      on inputs and outputs the id is the ins + pin, and on others it's ins
      this ensures that clearing timeouts work across relevant elements only
     */
  if (
    event.type === DebuggerEventType.INPUT_CHANGE ||
    event.type === DebuggerEventType.OUTPUT_CHANGE
  ) {
    return `${fullInsIdPath(event.insId, event.ancestorsInsIds)}.${event.pinId
      }`;
  } else {
    return fullInsIdPath(event.insId, event.ancestorsInsIds);
  }
};
export const cancelTimers = new Map();

export const playEvent = (event: DebuggerEvent) => {
  switch (event.type) {
    case DebuggerEventType.INPUT_CHANGE:
    case DebuggerEventType.OUTPUT_CHANGE: {
      const { pinId, insId, ancestorsInsIds } = event;
      const pinType =
        event.type === DebuggerEventType.INPUT_CHANGE ? "input" : "output";

      const domIds = [
        getPinDomId({
          fullInsIdPath: fullInsIdPath(insId, ancestorsInsIds),
          pinId,
          pinType,
          isMain: true,
        }),
      ];

      const mainPinDomId = getMainPinDomId(insId, pinId, pinType);
      const mainPinElement =
        document.getElementById(mainPinDomId)?.parentElement;

      if (mainPinElement) {
        mainPinElement.setAttribute("data-runtime", "done"); //should be "active", but wanted to piggy back existing node css
      } else {
        debug(
          `No DOM element with Id [${mainPinDomId}] found to play event`,
          event
        );
      }

      /* events from the root instance are not shown on "regular" pins but just on "main" ones */

      if (insId !== ROOT_INS_ID) {
        domIds.push(
          getPinDomId({
            fullInsIdPath: fullInsIdPath(insId, ancestorsInsIds),
            pinId,
            pinType,
            isMain: false,
          })
        );
      }

      domIds.forEach((domId, idx) => {
        const cancelTimerKey = getCancelTimerKey(event, `${idx}`);
        clearTimeout(cancelTimers.get(cancelTimerKey));
        const element = document.getElementById(domId);

        const connDomIdAttr = `${insId}.${pinId}`;
        const connectionElems =
          event.type === DebuggerEventType.OUTPUT_CHANGE
            ? document.querySelectorAll(`[data-from-id="${connDomIdAttr}"]`)
            : [];
        if (!element) {
          debug(`No DOM element with Id [${domId}] found to play event`, event);
        } else {
          clearTimeout(cancelTimers.get(cancelTimerKey));

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
            cancelTimers.delete(cancelTimerKey);
          }, BLINK_TIMEOUT);
          cancelTimers.set(getCancelTimerKey(event), timer);
        }
      });

      break;
    }
    case DebuggerEventType.PROCESSING_CHANGE: {
      const { insId, ancestorsInsIds } = event;

      const domIds = [getMainInstanceIndicatorDomId(insId, ancestorsInsIds)];

      if (insId !== ROOT_INS_ID) {
        domIds.push(getInstanceDomId(insId, ancestorsInsIds));
      }

      domIds.forEach((domId, idx) => {
        const timerKey = getCancelTimerKey(event, `${idx}`);
        const element = document.getElementById(domId)?.parentElement;
        if (!element) {
          debug(`No DOM element with Id [${domId}] found to play event`, event);
          return;
        }

        if (event.val === true) {
          element.setAttribute("data-runtime", "processing");
          clearTimeout(cancelTimers.get(timerKey));
        } else {
          // if the processing is done, but there was an error, don't remove the error indication
          element.removeAttribute("data-runtime");
          setTimeout(() => {
            if (element.getAttribute("data-runtime") === "error") {
              return;
            }
            element.setAttribute("data-runtime", "done");
          }, 0);
          const timer = setTimeout(() => {
            element.removeAttribute("data-runtime");
            cancelTimers.delete(timerKey);
          }, BLINK_TIMEOUT);
          cancelTimers.set(timerKey, timer);
        }
      });

      break;
    }
    case DebuggerEventType.ERROR: {
      const { insId, ancestorsInsIds } = event;

      const domIds = [getMainInstanceIndicatorDomId(insId, ancestorsInsIds)];

      if (insId !== ROOT_INS_ID) {
        domIds.push(getInstanceDomId(insId, ancestorsInsIds));
      }

      domIds.forEach((domId, idx) => {
        const timerKey = getCancelTimerKey(event, `${idx}`);
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
      });

      const fakeErrorPinEvent: DebuggerEvent = {
        ...event,
        type: DebuggerEventType.OUTPUT_CHANGE,
        pinId: ERROR_PIN_ID,
      };

      playEvent(fakeErrorPinEvent);
      break;
    }
    case DebuggerEventType.INPUTS_STATE_CHANGE: {
      const { insId, ancestorsInsIds } = event;
      entries(event.val).forEach(([k, v]) => {
        const domId = getPinDomId({
          fullInsIdPath: fullInsIdPath(insId, ancestorsInsIds),
          pinId: k,
          pinType: "input",
          isMain: false,
        });
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
      const someWaiting = Object.values(event.val).some((v) => (v ?? 0) > 0);
      const instanceDomId = getInstanceDomId(insId, ancestorsInsIds);
      const instanceElem =
        document.getElementById(instanceDomId)?.parentElement;
      if (!instanceElem) {
        debug(
          `No DOM element with Id [${instanceDomId}] found to play event`,
          event
        );
        return;
      }

      if (someWaiting && !instanceElem.getAttribute("data-runtime")) {
        instanceElem.setAttribute("data-runtime", "waiting");
      }
      break;
    }
  }
};
