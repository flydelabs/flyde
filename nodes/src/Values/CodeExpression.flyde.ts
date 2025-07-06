import { CodeNode } from "@flyde/core";

const getVariables = (code: string) => {
  return (code.match(/inputs\.([a-zA-Z]\w*)/g) || []).map((v) =>
    v.replace(/inputs\./, "")
  );
};


export interface CodeExpressionConfig {
  value: string;
}

export const CodeExpression: CodeNode<CodeExpressionConfig> = {
  id: "CodeExpression",
  namespace: "Values",
  mode: "advanced",
  icon: "code",
  menuDisplayName: "JS Expression",
  menuDescription: "Evaluates a JS expression. Supports dynamic variables",
  displayName: () => "Code Expression",
  description: (config) => `Evaluates the expression \`${config.value}\``,
  aliases: ["JS", "JavaScript", "Custom"],
  defaultConfig: {
    value: "`Hello ${inputs.firstName} ${inputs.lastName}`",
  },
  inputs: (config) => {
    const inputNames = getVariables(config.value ?? "");
    return Object.fromEntries(inputNames.map((input) => [input, {}]) ?? []);
  },
  outputs: () => ({
    value: {
      displayName: "Value",
      description: "The result of the expression evaluation",
    },
  }),
  run: (inputs, outputs, adv) => {
    try {
      const resFn = eval(`(inputs, adv) => (${adv.context.config.value})`);
      outputs.value.next(resFn(inputs, adv));
    } catch (e) {
      adv.onError(e);
    }
  },
  editorConfig: {
    type: "custom",
    editorComponentBundlePath: "../../dist/ui/CodeExpression.js",
  },
};
