import {
  InlineValueNodeType,
  nodeInput,
  nodeOutput,
  randomInt,
} from "@flyde/core";
import { inlineValueNode } from "@flyde/core";

export const getVariables = (code: string) => {
  return (code.match(/inputs\.([a-zA-Z]\w*)/g) || []).map((v) =>
    v.replace(/inputs\./, "")
  );
};

export type InlineValueNodeData = {
  code: string;
  customView?: string;
  nodeId?: string;
  type: InlineValueNodeType;
};
export const createInlineValueNode = ({
  code,
  customView,
  nodeId,
  type,
}: InlineValueNodeData) => {
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

  return inlineValueNode({
    id: nodeId || `Inline Code ${randomInt(99999)}`,
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
