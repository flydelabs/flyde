import { debugLogger } from "@flyde/core";
import { RuntimeEvents } from "@flyde/remote-debugger";
import { playEvent } from "./play-event";



const debug = debugLogger("runtime-player");

export interface RuntimePlayer {
  addEvents: (events: RuntimeEvents) => void;
  start: (dt?: number) => void;
  stop: () => void;
  destroy: () => void;
  clear: () => void;
  status: () => void;
}

export const createRuntimePlayer = (insId: string): RuntimePlayer => {
  let currDt = 0;

  let queue: RuntimeEvents = [];

  const playEvents = (fromDt: number, untilDt: number) => {
    // console.log(queue);
    // assumes sorting order
    const toPlay = queue // .filter((e) => e.dt < untilDt);
    queue = [] // queue.filter((e) => e.dt >= untilDt);

    if (toPlay.length) {
      debug(`Playing ${toPlay.length} events from`, fromDt, untilDt);
    }

    toPlay.forEach((e) => {
      debug(`Playing event`, e);
      playEvent(insId, e);
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
    queue = [];

    document.querySelectorAll("[data-runtime]").forEach((elem) => {
      elem.removeAttribute("data-runtime");
    });

    document.querySelectorAll("[data-runtime-queue]").forEach((elem) => {
      elem.removeAttribute("data-runtime-queue");
    });
  };

  return {
    stop,
    start: (dt = 0) => {
      running = true;
      currDt = dt;
      last = Date.now();
      step();
    },
    addEvents: (events) => {
      queue.push(...events);
      queue.sort((a, b) => a.dt - b.dt);
    },
    destroy: () => {
      stop();
      clear();
    },
    clear,
    status: () => {
      return {
        running, currDt, lastDt, queue, last
      }
    }
  };
};
