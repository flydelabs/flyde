import { OMap } from "..";

export const compileStringTemplate = (template: string, inputs: OMap<any>) => {
  let val = decodeURIComponent(template);

  Object.keys(inputs).forEach((key) => {
    const inpVal = inputs[key];

    // pattern to replace dynamic placeholders inside strings
    const stringPatternStr = "\\$\\{" + key + "\\}";
    const stringPattern = new RegExp(stringPatternStr, "g");

    val = val.replace(stringPattern, inpVal);
  });

  return val;
};

export const compileObjectTemplate = (template: string, inputs: OMap<any>) => {
  let val = decodeURIComponent(template);

  Object.keys(inputs).forEach((key) => {
    const rawVal = inputs[key];
    const inpVal = JSON.stringify(rawVal);

    // pattern to replace dynamic placeholders inside objects
    const valuesPatternStr = '"\\$\\$\\{' + key + '\\}"';
    const valuesPattern = new RegExp(valuesPatternStr, "g");

    const stringPatternStr = "\\$\\{" + key + "\\}";
    const stringPattern = new RegExp(stringPatternStr, "g");

    const fixedRaw =
      typeof rawVal === "string"
        ? rawVal.replace(/"/g, (_, idx, str) => {
            if (str[idx - 1] !== "\\") {
              return '\\"';
            } else {
              return str[idx];
            }
          })
        : rawVal;

    val = val
      .replace(valuesPattern, inpVal)
      .replace(stringPattern, fixedRaw)
      .replace(/\n/g, "\\n");
  });

  return JSON.parse(val);
};
