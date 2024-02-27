import React from "react";

const safeLocalStorage = {
  getItem: (key: string) => {
    try {
      return localStorage.getItem(key);
    } catch (e) {
      return null;
    }
  },
  setItem: (key: string, value: string) => {
    try {
      localStorage.setItem(key, value);
    } catch (e) {
      console.error(e);
    }
  },
};

const safelyGetItem = (key: string) => {
  const val = safeLocalStorage.getItem(key);
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
      safeLocalStorage.setItem(key, JSON.stringify({ value }));
      setVal(value);
    },
    [key]
  );

  React.useEffect(() => {
    const existing = safelyGetItem(key);
    if (!existing) {
      safeLocalStorage.setItem(key, JSON.stringify({ value: initial }));
    }
  }, [key, initial, setAndSave]);

  return [val, setAndSave];
};
