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
    r: partOutput("any"),
  };

  const fnCode =
    type === CodePartTemplateTypeInline.FUNCTION
      ? `const result = (function() { ${code}}());
  outputs.r.next(result)`
      : `outputs.r.next((${code}))`;

  const dataBuilderSource = btoa(code);

  return codePart({
    id: partId || `Inline Code ${randomInt(99999)}`,
    inputs,
    outputs,
    fnCode,
    customViewCode: customView || code,
    dataBuilderSource,
    templateType: type,
    completionOutputs: ["r"],
    defaultStyle: {
      size: 'small',
      icon: 'code',
      cssOverride: {
        fontFamily: 'monospace',
        fontWeight: '500'
      }
    }
  });
};
