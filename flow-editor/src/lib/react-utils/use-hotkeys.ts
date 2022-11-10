import hotkeys, {HotkeysEvent} from 'hotkeys-js';
import {useCallback, useEffect} from "react";

type CallbackFn = (event: KeyboardEvent, handler: HotkeysEvent) => void;

export function useHotkeys(keys: string, callback: CallbackFn, controlRef?: React.MutableRefObject<boolean>, deps: any[] = [], opts = {}) {
  const memoisedCallback = useCallback<CallbackFn>((...args) => {
    if (!controlRef || controlRef.current) {
      callback(...args);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, callback]);

  useEffect(() => {
    hotkeys(keys, opts, memoisedCallback);

    return () => hotkeys.unbind(keys, memoisedCallback);
  }, [keys, memoisedCallback, opts]);
}