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

export type ConstBuilderNodeDto = {
  placeholders: string[];
  constValue: any;
};
