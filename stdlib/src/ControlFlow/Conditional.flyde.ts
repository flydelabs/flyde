import {
  extractInputsFromValue,
  macro2toMacro,
  MacroNodeV2,
  replaceInputsInValue,
} from "../ImprovedMacros/improvedMacros";

export enum ConditionType {
  Equal = "EQUAL",
  NotEqual = "NOT_EQUAL",
  Contains = "CONTAINS",
  NotContains = "NOT_CONTAINS",
  RegexMatches = "REGEX_MATCHES",
  Exists = "EXISTS",
  NotExists = "NOT_EXISTS",
}

export interface ConditionalConfig {
  condition: { type: ConditionType; data?: string };
  leftOperand: {
    value: any;
  };
  rightOperand: {
    value: any;
  };
}

function conditionalConfigToDisplayName(config: ConditionalConfig) {
  const { type } = config.condition;
  const rightOperand = JSON.stringify(config.rightOperand.value);

  switch (type) {
    case ConditionType.Equal:
      return `Equals ${rightOperand}`;
    case ConditionType.NotEqual:
      return `Does not equal ${rightOperand}`;
    case ConditionType.Contains:
      return `Contains ${rightOperand}`;
    case ConditionType.NotContains:
      return `Does not contain ${rightOperand}`;
    case ConditionType.RegexMatches:
      return `Matches regex ${rightOperand}`;
    case ConditionType.Exists:
      return `Exists`;
    case ConditionType.NotExists:
      return `Does not exist`;
  }
}

const conditional: MacroNodeV2<ConditionalConfig> = {
  id: "Conditional",
  namespace: "Control Flow",
  menuDisplayName: "Conditional",
  defaultConfig: {
    condition: {
      type: ConditionType.Equal,
    },
    leftOperand: { value: "{{value}}" },
    rightOperand: { value: "Some value" },
  },
  menuDescription:
    "Evaluates a condition and emits the value of the matching case",
  displayName: (config) => conditionalConfigToDisplayName(config),
  description: (config) =>
    `Evaluates if ${JSON.stringify(
      config.leftOperand.value
    )} ${conditionalConfigToDisplayName(config)}`,
  defaultStyle: {
    icon: "circle-question",
  },
  inputs: (config) => ({
    ...extractInputsFromValue(config.leftOperand.value),
    ...extractInputsFromValue(config.rightOperand.value),
  }),
  outputs: {
    true: {
      description: "Emits the value if the condition is true",
    },
    false: {
      description: "Emits the value if the condition is false",
    },
  },
  run: (inputs, outputs, adv) => {
    const { condition, leftOperand, rightOperand } = adv.context.config;
    const { true: trueOutput, false: falseOutput } = outputs;

    const leftSide = replaceInputsInValue(inputs, leftOperand.value);
    const rightSide = replaceInputsInValue(inputs, rightOperand.value);

    const result = calculateCondition(leftSide, rightSide, condition);

    const outputToUse = result ? trueOutput : falseOutput;
    outputToUse.next(inputs.value);
  },
  configEditor: {
    type: "custom",
    editorComponentBundlePath: "../../dist/ui/Conditional.js",
  },
};

function calculateCondition(
  val1: any,
  val2: any,
  condition: ConditionalConfig["condition"]
) {
  switch (condition.type) {
    case ConditionType.Equal:
      return val1 === val2;
    case ConditionType.NotEqual:
      return val1 !== val2;
    case ConditionType.Contains:
      if (Array.isArray(val1)) {
        return val1.includes(val2);
      } else if (typeof val1 === "string") {
        return val1.includes(val2);
      }
      return false;
    case ConditionType.NotContains:
      if (Array.isArray(val1)) {
        return !val1.includes(val2);
      } else if (typeof val1 === "string") {
        return !val1.includes(val2);
      }
      return true;
    case ConditionType.RegexMatches: {
      return typeof val1 === "string" && new RegExp(val2).test(val1);
    }
    case ConditionType.Exists:
      return val1 !== null && val1 !== undefined && val1 !== "";
    case ConditionType.NotExists:
      return val1 === null || val1 === undefined || val1 === "";
  }
}

export const Conditional = macro2toMacro(conditional);
