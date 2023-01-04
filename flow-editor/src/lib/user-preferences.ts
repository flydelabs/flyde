import * as React from "react";
import { isDefined } from "../utils";
import { safeLocalstorage, safeSessionStorage } from "./safe-ls";

const createUserPreferences = () => {
  const prefixedKey = (k: string) => `up.${k}`;
  return {
    getItem: (key: string) => {
      const strLs = safeLocalstorage.getItem(prefixedKey(key)) || "";
      const strSs = safeSessionStorage.getItem(prefixedKey(key)) || "";
      try {
        const obj = JSON.parse(strSs || strLs);
        return obj.value;
      } catch (e) {
        return undefined;
      }
    },
    setItem: (key: string, value: any, sessionOnly: boolean = false) => {
      const storage = sessionOnly ? sessionStorage : safeLocalstorage;
      try {
        const str = JSON.stringify({ value });
        storage.setItem(prefixedKey(key), str);
        return true;
      } catch (e) {
        console.error("Error saving user preference", e);
        return false;
      }
    },
  };
};

// THIS HOOK
export const useUserPref = <T>(
  key: string,
  initial: T
): [T, (val: T) => void] => {
  const [val, setVal] = React.useState(() => {
    const existing = userPreferences.getItem(key);
    return isDefined(existing) ? existing : initial;
  });

  React.useEffect(() => {
    const existing = userPreferences.getItem(key);
    const val = isDefined(existing) ? existing : initial;
    setVal(val);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  const setAndSave = (val: T) => {
    userPreferences.setItem(key, val);
    console.log("Saved", key, val);

    setVal(val);
  };

  return [val, setAndSave];
};

export const userPreferences = createUserPreferences();

export const useResizePref = (
  feature: string,
  initial: number
): [number, (val: number) => void] => {
  const prefKey = `resize.${feature}`;
  return useUserPref(prefKey, initial);
};

const safelyGetItem = (key: string) => {
  const val = safeLocalstorage.getItem(key);
  if (!val) {
    return null;
  }
  try {
    return JSON.parse(val).value;
  } catch (e) {
    return null;
  }
};

export const useLocalStorage = <T>(
  key: string,
  initial: T
): [T, (val: T) => void] => {
  const [val, setVal] = React.useState(safelyGetItem(key) || initial);

  const setAndSave = React.useCallback(
    (value: T) => {
      safeLocalstorage.setItem(key, JSON.stringify({ value }));
      setVal(value);
    },
    [key]
  );

  React.useEffect(() => {
    const existing = safelyGetItem(key);
    if (!existing) {
      safeLocalstorage.setItem(key, JSON.stringify({ value: initial }));
    }
  }, [key, initial, setAndSave]);

  return [val, setAndSave];
};
