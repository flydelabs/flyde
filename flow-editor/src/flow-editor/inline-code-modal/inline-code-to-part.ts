import {
  InlineValueNodeType,
  nodeInput,
  nodeOutput,
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
  type: InlineValueNodeType;
};
export const createInlineValuePart = ({
  code,
  customView,
  partId,
  type,
}: InlineValuePartData) => {
  const variables = getVariables(code);

  const inputs = variables.reduce((prev, curr) => {
    return { ...prev, [curr]: nodeInput() };
  }, {});

  const outputs = {
    value: nodeOutput(),
  };

  const runFnRawCode =
    type === InlineValueNodeType.FUNCTION
      ? `const result = (function() { ${code}}());
  Promise.resolve(result).then(val => outputs.value.next(val))`
      : `const result = (${code}); Promise.resolve(result).then(val => outputs.value.next(val))`;

  const dataBuilderSource = btoa(code);

  return inlineValuePart({
    id: partId || `Inline Code ${randomInt(99999)}`,
    inputs,
    outputs,
    runFnRawCode,
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
      type === InlineValueNodeType.VALUE ? "value" : "function"
    }`,
  });
};
