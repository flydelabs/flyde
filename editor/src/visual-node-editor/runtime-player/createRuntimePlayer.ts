import {
  DebuggerEvent,
  DebuggerEventType,
  debugLogger,
  ROOT_INS_ID,
} from "@flyde/core";
import { playEvent } from "./play-event";

const debug = debugLogger("runtime-player");

export interface RuntimePlayer {
  addEvents: (events: Array<DebuggerEvent>) => void;
  start: (dt?: number) => void;
  stop: () => void;
  destroy: () => void;
  clear: () => void;
  status: () => void;
}

export const createRuntimePlayer = (): RuntimePlayer => {
  let currDt = 0;

  let queue: DebuggerEvent[] = [];

  const playEvents = (fromDt: number, untilDt: number) => {
    // assumes sorting order
    const toPlay = queue; // .filter((e) => e.dt < untilDt);
    queue = []; // queue.filter((e) => e.dt >= untilDt);

    if (toPlay.length) {
      debug(`Playing ${toPlay.length} events from`, fromDt, untilDt);
    }

    toPlay.forEach((e) => {
      debug(`Playing event`, e);
      playEvent(e);
    });
  };

  let running = false;
  let last = Date.now();

  let lastDt = currDt;

  const step = () =>
    requestAnimationFrame(() => {
      const n = Date.now();
      lastDt = currDt;
      currDt += n - last;
      last = n;

      playEvents(lastDt, currDt);

      if (running) {
        step();
      }
    });

  const stop = () => {
    running = false;
  };

  const clear = () => {
    document.querySelectorAll("[data-runtime]").forEach((elem) => {
      console.log("removing data-runtime #1c", elem);
      elem.removeAttribute("data-runtime");
    });
    document.querySelectorAll("[data-runtime-queue]").forEach((elem) => {
      elem.removeAttribute("data-runtime-queue");
    });
    queue = [];
  };

  return {
    stop,
    start: (dt = 0) => {
      clear();
      running = true;
      currDt = dt;
      last = Date.now();
      step();
    },
    addEvents: (events) => {
      queue.push(...events);
    },
    destroy: () => {
      stop();
      clear();
    },
    clear,
    status: () => {
      return {
        running,
        currDt,
        lastDt,
        queue,
        last,
      };
    },
  };
};
