import { randomInt } from "..";
import { codePart, partInput, partOutput } from "../..";

export const getConstValuePlaceholders = (v: any) => {
  const pattern = /\$\{([a-zA-Z \d.]*)\}/g;
  const placeholderMatches = [];
  let lastResult;
  do {
    lastResult = pattern.exec(JSON.stringify(v));
    if (lastResult) {
      placeholderMatches.push(lastResult[1]);
    }
  } while (lastResult);
  return placeholderMatches;
};

export type ConstBuilderPartDto = {
  placeholders: string[];
  constValue: any;
};
