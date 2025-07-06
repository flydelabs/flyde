import { isJsxValue } from "./visual-node-editor/utils";

import moment from "moment";
import React from "react";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export interface OMap<_, V> {
  [k: string]: V | undefined;
}

type Entries<V> = Array<[string, V]>;
// tslint:disable-next-line:one-variable-per-declaration
export const entries = <V>(map: OMap<any, V>): Entries<V> => {
  return Object.keys(map).map((k) => {
    return [k, map[k]] as [string, V];
  });
};

export const keys = <V>(map: OMap<any, V>): string[] => {
  return Object.keys(map);
};

export const values = <V>(map: OMap<any, V>): V[] => {
  return Object.keys(map).map((k) => map[k] as V);
};

export const toOmap = <V>(map: Map<string, V>): OMap<string, V> => {
  return Array.from(map.entries()).reduce(
    (p, [k, v]) => ({
      ...p,
      [k]: v,
    }),
    {}
  );
};

export const createOmap = <V>(entr: Entries<V> = []): OMap<string, V> => {
  return entr.reduce((p, c) => {
    return { ...p, [c[0]]: c[1] };
  }, {});
};

export const set = <V>(map: OMap<any, V>, k: string, v: V) => {
  map[k] = v;
};

export const isDefined = <T>(o: T | undefined): o is T => {
  return typeof o !== "undefined";
};

export type Size = { width: number; height: number };

export const toString = (v: any): string => {
  const type = typeof v;

  if (v === "") {
    return "(empty string)";
  }

  if (isJsxValue(v)) {
    return "JSX Value";
  }

  switch (type) {
    case "object":
      try {
        const str = JSON.stringify(v);
        return str === "{}" ? "Empty object" : str;
      } catch (e) {
        return `Object (cannot stringify)`;
      }
    default:
      return `${v}`;
  }
};

export const timeAgo = (d: number) => {
  return moment(new Date(d)).fromNow();
};

export const timeAgoFromDt = (dt: number) => {
  return moment(Date.now() - dt).fromNow();
};

export const fullTime = (d: number) => {
  return moment(new Date(d)).toString();
};

export const isLocal = () => {
  return location.href.includes(":300"); // hacky way because we're forcing env for react to perform faster
};

export const preventDefaultAnd =
  <T extends (...args: any[]) => any>(fn: T) =>
  (e: React.MouseEvent) => {
    e.preventDefault();
    fn(e);
  };
