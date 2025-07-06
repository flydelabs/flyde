import { configurableValue, ConfigurableValue } from "@flyde/core";
import {
  CodeNode,
  extractInputsFromValue,
  replaceInputsInValue,
} from "@flyde/core";

enum ConditionType {
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
  leftOperand: ConfigurableValue;
  rightOperand: ConfigurableValue;
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

export const Conditional: CodeNode<ConditionalConfig> = {
  id: "Conditional",
  namespace: "Control Flow",
  mode: "advanced",
  menuDisplayName: "Conditional",
  defaultConfig: {
    condition: {
      type: ConditionType.Equal,
    },
    leftOperand: configurableValue("string", "{{value}}"),
    rightOperand: configurableValue("string", "Some value"),
  },
  menuDescription:
    "Evaluates the condition, and if it's true, emits the left operand value to the 'true' output, otherwise emits the left operand value to the 'false' output",
  displayName: (config) => conditionalConfigToDisplayName(config),
  description: (config) =>
    `Evaluates if ${JSON.stringify(
      config.leftOperand.value
    )} ${conditionalConfigToDisplayName(config)}`,
  icon: "circle-question",

  inputs: (config) => ({
    ...extractInputsFromValue(config.leftOperand, "leftOperand"),
    ...extractInputsFromValue(config.rightOperand, "rightOperand"),
  }),
  outputs: {
    true: {
      description: "Emits the left operand value if the condition is true",
    },
    false: {
      description: "Emits the left operand value if the condition is false",
    },
  },
  run: (inputs, outputs, adv) => {
    const { condition, leftOperand, rightOperand } = adv.context.config;
    const { true: trueOutput, false: falseOutput } = outputs;

    const leftSide = replaceInputsInValue(
      inputs,
      leftOperand,
      "leftOperand",
      false
    );
    const rightSide = replaceInputsInValue(
      inputs,
      rightOperand,
      "rightOperand",
      false
    );

    const result = calculateCondition(leftSide, rightSide, condition);

    const outputToUse = result ? trueOutput : falseOutput;
    outputToUse.next(leftSide);
  },
  editorConfig: {
    type: "custom",
    editorComponentBundlePath: "../../../dist/ui/Conditional.js",
  },
};

function calculateCondition(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  val1: any,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
