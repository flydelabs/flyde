export const cappedArrayDebounce = <T>(
  cb: (items: T[]) => void,
  timeout: number,
  maxItems: number,
  maxTimeWaiting = 500
) => {
  let arr: T[] = [];
  let timer: any = null;

  let maxTimeoutTimer: any = null;

  return {
    addItem: (item: T) => {
      clearTimeout(timer);
      arr.push(item);

      if (!maxTimeoutTimer) {
        maxTimeoutTimer = setTimeout(() => {
          cb(arr);
          clearTimeout(timer);
          maxTimeoutTimer = null;
        }, maxTimeWaiting);
      }

      if (arr.length >= maxItems) {
        cb(arr);
        clearTimeout(maxTimeoutTimer);
        maxTimeoutTimer = null;
        arr = [];
      } else {
        timer = setTimeout(() => {
          cb(arr);
          clearTimeout(maxTimeoutTimer);
          maxTimeoutTimer = null;
          arr = [];
        }, timeout);
      }
    },
    flush: () => {
      if (arr.length) {
        cb(arr);
        arr = [];
        clearTimeout(maxTimeoutTimer);
      }
    },
    pendingItems: () => arr.length,
  };
};
