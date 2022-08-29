import { partInput, partOutput } from "@flyde/core";
import { codePart, randomInt } from "@flyde/core";

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

export const createConstStringBuilderPart = (dto: ConstBuilderPartDto, partId?: string) => {
  const { placeholders, constValue } = dto;

  const inputs = placeholders.reduce((prev, curr) => {
    return { ...prev, [curr]: partInput("any", 'required') };
  }, {});

  const id = partId || `String-builder-${randomInt(99999)}`;

  const outputs = { r: partOutput("string") };

  const fnCode = `outputs.r.next(compileStringTemplate("${encodeURIComponent(constValue)}", inputs));`;

  return codePart({
    id,
    inputs,
    outputs,
    fnCode,
    customViewCode: constValue,
    dataBuilderSource: constValue,
    completionOutputs: ['r']
  });
};


export const createConstObjectBuilderPart = (dto: ConstBuilderPartDto, partId?: string) => {
  const { placeholders, constValue } = dto;

  const inputs = placeholders.reduce((prev, curr) => {
    return { ...prev, [curr]: partInput("any", 'required') };
  }, {});

  const id = partId || `Object-builder-${randomInt(99999)}`;

  const outputs = { r: partOutput("object") };

  const strVal = JSON.stringify(constValue);

  const fnCode = `outputs.r.next(compileObjectTemplate("${encodeURIComponent(strVal)}", inputs));`;

  // transform constValue into base64 encoded string
  const dataBuilderSource = btoa(strVal);

  return codePart({
    id,
    inputs,
    outputs,
    fnCode,
    customViewCode: strVal,
    dataBuilderSource,
  });
};
