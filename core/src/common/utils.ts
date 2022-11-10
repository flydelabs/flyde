import { CustomPartRepo } from "..";
import { CustomPart, isCodePart } from "../part";

export type Pos = {
  x: number;
  y: number;
};

export interface OMap<T> {
  [k: string]: T | undefined;
}

export interface OMapF<T> {
  [k: string]: T;
}

export const mapOMap = <T>(map: OMap<T>, cb: (key: string, item: T) => T) => {
  return entries(map)
    .map(([key, item]) => [key, cb(key, item)])
    .reduce<OMap<T>>((acc, [k, v]: any) => {
      return { ...acc, [k]: v };
    }, {});
};

export const filterOMap = <T>(map: OMap<T>, cb: (key: string, item: T) => boolean) => {
  return entries(map)
    .filter(([key, item]) => cb(key, item))
    .reduce<OMap<T>>((acc, [k, v]: any) => {
      return { ...acc, [k]: v };
    }, {});
};

export const keys = <V>(map: OMap<V>): string[] => {
  return Object.keys(map);
};

export const values = <V>(map: OMap<V>): V[] => {
  return Object.values(map);
};

export const okeys = keys;

export const entries = <V>(map: OMap<V>): Array<[string, V]> => {
  return okeys(map).map<[string, V]>((k) => [k, map[k] as V]);
};

export const fromEntries = <V>(entries: Array<[string, V]>): OMap<V> => {
  return entries.reduce((p, [k, v]) => {
    return { ...p, [k]: v };
  }, {});
};

export const pickFirst = <K>(v: [K, any]): K => v[0];
export const pickSecond = <K>(v: [any, K]): K => v[1];

export type RandomFunction = {
  (max: number): number;
  (max: number, min: number): number;
};

export const randomInt: RandomFunction = (to: number, from = 0) => {
  const rnd = Math.random();
  return from + Math.floor((to - from) * rnd);
};

export const randomPos = (to = 1000, from = 0): Pos => {
  const x = randomInt(to, from);
  const y = randomInt(to, from);
  return { x, y };
};

export const pickRandom = <K>(v: K[]): K => v[randomInt(v.length)];

export const repeat = <T>(count: number, fn: (idx: number) => T) => {
  return "x"
    .repeat(count)
    .split("")
    .map((_, idx) => fn(idx));
};

export const randomInts = (count: number, to = 100, from = 0) => {
  return repeat(count, () => randomInt(to, from));
};

export const shuffle = (arr: any[]) => {
  const a = [...arr];
  for (let i = a.length - 1; i >= 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

export const containsAll = <T>(arr: T[], items: T[]) => {
  return items.every((elem) => arr.includes(elem)); // output: true
};

export const isDefined = <T>(o: T): o is NonNullable<T> => {
  return typeof o !== "undefined";
};

export const isOptionalType = (type: string) => {
  return /\?$/.test(type);
};

export const ensure = <T>(v: T, msg?: string): NonNullable<T> => {
  if (typeof v === "undefined") {
    throw new Error(msg || `Undefined value passed`);
  }
  // @ts-ignore TODO - fix typings
  return v;
};

export const removeDupes = (list: string[]) => {
  return Array.from(new Set(list));
};

export const noop = () => {
  // do nothing
};

export const delay = (ms: number) => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

export const eventually = async (
  callback: () => void,
  timeout = 3000,
  retryDelay = 100,
  errorSet: Set<string> = new Set()
): Promise<void> => {
  if (timeout < 0) {
    const message = Array.from(errorSet).reduce(
      (previousMessage, currentMessage, idx) =>
        `${previousMessage}\n\t\t${idx + 1}. ${currentMessage}`,
      ""
    );
    throw new Error(`[Eventually timeout exceeded after: timeout with error]: ${message}`);
  }
  try {
    await callback();
  } catch (e) {
    const now = Date.now();
    await delay(retryDelay);
    const delta = Date.now() - now;
    errorSet.add(e.message);
    return eventually(callback, timeout - delta, retryDelay, errorSet);
  }
};
