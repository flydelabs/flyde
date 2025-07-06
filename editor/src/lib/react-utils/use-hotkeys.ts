import hotkeys, { HotkeysEvent } from "hotkeys-js";
import { useCallback, useEffect } from "react";

type CallbackFn = (event: KeyboardEvent, handler: HotkeysEvent) => void;

export interface HotkeysMenuData {
  text: string;
  order?: number;
  group: string;
}

export let currentHotkeys = new Map<string, HotkeysMenuData>();

export function useHotkeys(
  keys: string,
  callback: CallbackFn,
  menuData: HotkeysMenuData,
  deps: any[] = [],
  controlRef?: React.MutableRefObject<boolean>,
  
) {
  const memoisedCallback = useCallback<CallbackFn>(
    (...args) => {
      if (!controlRef || controlRef.current) {
        callback(...args);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [...deps, callback]
  );

  useEffect(() => {
    hotkeys(keys, {}, memoisedCallback);
    currentHotkeys.set(keys, menuData);

    return () => {
      currentHotkeys.delete(keys);
      hotkeys.unbind(keys, memoisedCallback)
    };
  }, [keys, memoisedCallback, menuData]);
}
