import { serializeError } from "serialize-error";

const STRING_LIMIT = 250;
const PREVIEW_LIMIT = 100;

export const toString = (v: any) => {
  const type = typeof v;

  switch (type) {
    case "object":
      if (v instanceof Error) {
        return JSON.stringify(serializeError(v));
      }
      try {
        return JSON.stringify(v).substr(0, STRING_LIMIT);
      } catch (e) {
        return `Object (cannot stringify)`;
      }
    default:
      return `${v}`.substr(0, STRING_LIMIT);
  }
};

export const valuePreview = (v: any) => {
  return toString(v).substr(0, PREVIEW_LIMIT);
};

export const isSimpleType = (v: any) => {
  return ["number", "string", "boolean"].includes(typeof v);
};

export const isNumber = (v: any) => isNaN(Number(v)) === false;

export function enumToArray(aEnum: any) {
  return Object.keys(aEnum)
    .filter(isNumber)
    .map((key) => aEnum[key]);
}