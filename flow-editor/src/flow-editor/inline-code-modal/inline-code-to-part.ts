import { CodePartTemplateTypeInline, partInput, partOutput, randomInt } from "@flyde/core";
import { codePart } from "@flyde/core";

export const getVariables = (code: string) => {
  return (code.match(/inputs\.([a-zA-Z]\w*)/g) || []).map((v) => v.replace(/inputs\./, ""));
};

export type InlineCodePartData = {
  code: string;
  customView?: string;
  partId?: string;
  type: CodePartTemplateTypeInline;
};
export const createInlineCodePart = ({ code, customView, partId, type }: InlineCodePartData) => {
  const variables = getVariables(code);

  const inputs = variables.reduce((prev, curr) => {
    return { ...prev, [curr]: partInput("any", "required") };
  }, {});

  const outputs = {
    value: partOutput("any"),
  };

  const fnCode =
    type === CodePartTemplateTypeInline.FUNCTION
      ? `const result = (function() { ${code}}());
  Promise.resolve(result).then(val => outputs.value.next(val))`
      : `const result = (${code}); Promise.resolve(result).then(val => outputs.value.next(val))`;

  const dataBuilderSource = btoa(code);

  return codePart({
    id: partId || `Inline Code ${randomInt(99999)}`,
    inputs,
    outputs,
    fnCode,
    customViewCode: customView || code,
    dataBuilderSource,
    templateType: type,
    completionOutputs: ["value"],
    defaultStyle: {
      size: 'regular',
      icon: 'code',
      cssOverride: {
        fontFamily: 'monospace',
        fontWeight: '500'
      }
    }
  });
};
