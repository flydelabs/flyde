import { debugLogger } from "@flyde/core";
import { serializeError } from "serialize-error";

const debug = debugLogger("remote-debugger:normalize-data");

export const normalizeData = (data: any) => {
  // if it's an object, mark any circular references as "<<circular>>" (using a WeakRef)

  if (data instanceof Error) {
    return serializeError(data);
  } else if (typeof data === "object" && data !== null) {
    // hack to avoid toJSON overrides (i.e. in discord bot)
    data = { ...data };

    const seen = new WeakSet();
    const normalize = (data: any) => {
      if (typeof data === "bigint") {
        return data.toString();
      }

      if (typeof data !== "object" || Array.isArray(data)) {
        return data;
      }

      if (data === null) {
        return data;
      }

      if (seen.has(data)) {
        return "[Circular]";
      }
      try {
        seen.add(data);
      } catch (e) {
        debug(
          "Error adding to WeakSet",
          "data:",
          data,
          `type:`,
          typeof data,
          `error:`,
          e
        );
      }
      if (Array.isArray(data)) {
        return data.map(normalize);
      }
      if (typeof data === "object") {
        const normalized: any = {};
        for (const key in data) {
          normalized[key] = normalize(data[key]);
        }
        return normalized;
      }
      return data;
    };
    return normalize(data);
  }
  return data;
};
