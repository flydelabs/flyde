
export const cappedArrayDebounce = <T>(
    cb: (items: T[]) => void,
    timeout: number,
    maxItems: number,
    maxTimeWaiting = 500
  ) => {
    let arr: T[] = [];
    let timer: any = null;

    let maxTimeoutTimer: any = null;
  
    return (item: T) => {
      clearTimeout(timer);
      arr.push(item);

      if (!maxTimeoutTimer) {
        maxTimeoutTimer = setTimeout(() => {
              cb(arr)
              clearTimeout(timer);
              maxTimeoutTimer = null;
          }, maxTimeWaiting)
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
    };
  };