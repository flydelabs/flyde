/* eslint-disable @typescript-eslint/no-explicit-any */
import { ConfigurableValue } from "@flyde/core";

export function convertValue(
  oldType: ConfigurableValue["type"],
  newType: ConfigurableValue["type"],
  value: any
): any {
  switch (newType) {
    case "string": {
      switch (oldType) {
        case "json": {
          return JSON.stringify(value);
        }
        default: {
          return value.toString();
        }
      }
    }
    case "number": {
      switch (oldType) {
        case "string":
        case "json": {
          const parsed = parseFloat(value as string);
          if (isNaN(parsed)) {
            return 0;
          }
          return parsed;
        }
        default: {
          return value;
        }
      }
    }
    case "boolean": {
      switch (oldType) {
        case "json":
        case "string": {
          return value === "true" || value === "1";
        }
        default: {
          return !!value;
        }
      }
    }
    default: {
      return value;
    }
  }
}
