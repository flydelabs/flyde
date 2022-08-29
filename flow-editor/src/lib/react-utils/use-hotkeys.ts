import hotkeys, {HotkeysEvent} from 'hotkeys-js';
import {useCallback, useEffect} from "react";

type CallbackFn = (event: KeyboardEvent, handler: HotkeysEvent) => void;

export function useHotkeys(keys: string, callback: CallbackFn, deps: any[] = [], opts = {}) {
  const memoisedCallback = useCallback(callback, [...deps, callback]);

  useEffect(() => {
    hotkeys(keys, opts, memoisedCallback);

    return () => hotkeys.unbind(keys, memoisedCallback);
  }, [keys, memoisedCallback, opts]);
}