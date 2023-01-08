import {
  InlineValuePartType,
  partInput,
  partOutput,
  randomInt,
} from "@flyde/core";
import { inlineValuePart } from "@flyde/core";

export const getVariables = (code: string) => {
  return (code.match(/inputs\.([a-zA-Z]\w*)/g) || []).map((v) =>
    v.replace(/inputs\./, "")
  );
};

export type InlineValuePartData = {
  code: string;
  customView?: string;
  partId?: string;
  type: InlineValuePartType;
};
export const createInlineValuePart = ({
  code,
  customView,
  partId,
  type,
}: InlineValuePartData) => {
  const variables = getVariables(code);

  const inputs = variables.reduce((prev, curr) => {
    return { ...prev, [curr]: partInput("any", "required") };
  }, {});

  const outputs = {
    value: partOutput("any"),
  };

  const fnCode =
    type === InlineValuePartType.FUNCTION
      ? `const result = (function() { ${code}}());
  Promise.resolve(result).then(val => outputs.value.next(val))`
      : `const result = (${code}); Promise.resolve(result).then(val => outputs.value.next(val))`;

  const dataBuilderSource = btoa(code);

  return inlineValuePart({
    id: partId || `Inline Code ${randomInt(99999)}`,
    inputs,
    outputs,
    fnCode,
    customViewCode: customView || code,
    dataBuilderSource,
    templateType: type,
    completionOutputs: ["value"],
    defaultStyle: {
      size: "regular",
      icon: "code",
      cssOverride: {
        fontFamily: "monospace",
        fontWeight: "500",
      },
    },
    description: `Custom inline ${
      type === InlineValuePartType.VALUE ? "value" : "function"
    }`,
  });
};
